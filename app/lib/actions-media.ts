'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { isAdmin } from "@/lib/auth-utils"
import { readdir, mkdir, rename, stat, writeFile } from "fs/promises"
import { join } from "path"
import { revalidatePath } from "next/cache"

/**
 * Recursively extracts all image URLs starting with /uploads/ from a Tiptap JSON object.
 */
function extractUploadsFromJson(json: any, urls: Map<string, any[]>, source: { type: string, id: string, title: string }) {
    if (!json) return

    const str = typeof json === 'string' ? json : JSON.stringify(json)
    const regex = /\/uploads\/[a-zA-Z0-9_\-\.]+/g
    let match;
    while ((match = regex.exec(str)) !== null) {
        const url = match[0]
        if (!urls.has(url)) urls.set(url, [])
        urls.get(url)?.push(source)
    }
}

export async function cleanUnreferencedMedia() {
    const session = await auth()
    if (!isAdmin(session?.user?.email)) {
        return { success: false, message: "Unauthorized: Admin only", mediaItems: [] }
    }

    try {
        const urlSources = new Map<string, any[]>()

        const addSource = (url: string, source: any) => {
            if (!urlSources.has(url)) urlSources.set(url, [])
            urlSources.get(url)?.push(source)
        }

        // 1. Scan Diary Entries
        const entries = await prisma.entry.findMany({
            select: { id: true, title: true, content: true }
        })
        entries.forEach(entry => {
            if (entry.content) {
                extractUploadsFromJson(entry.content, urlSources, { type: 'Entry', id: entry.id, title: entry.title })
            }
        })

        // 2. Scan Blog Posts
        const blogPosts = await prisma.blogPost.findMany({
            select: { id: true, title: true, content: true, featuredImage: true }
        })
        blogPosts.forEach(post => {
            if (post.content) {
                extractUploadsFromJson(post.content, urlSources, { type: 'Blog Post', id: post.id, title: post.title })
            }
            if (post.featuredImage?.startsWith('/uploads/')) {
                addSource(post.featuredImage, { type: 'Featured Image', id: post.id, title: post.title })
            }
        })

        // 3. Scan Users
        const users = await prisma.user.findMany({
            select: { id: true, name: true, image: true }
        })
        users.forEach(user => {
            if (user.image?.startsWith('/uploads/')) {
                addSource(user.image, { type: 'User Profile', id: user.id, title: user.name || user.id })
            }
        })

        // 4. Scan Journals
        const journals = await prisma.journal.findMany({
            select: { id: true, title: true, coverImage: true }
        })
        journals.forEach(journal => {
            if (journal.coverImage?.startsWith('/uploads/')) {
                addSource(journal.coverImage, { type: 'Journal Cover', id: journal.id, title: journal.title })
            }
        })

        // 5. Scan Assets table
        const assets = await prisma.asset.findMany({
            select: { id: true, url: true, entryId: true, entry: { select: { title: true } } }
        })
        assets.forEach(asset => {
            if (asset.url?.startsWith('/uploads/')) {
                addSource(asset.url, { type: 'Legacy Asset', id: asset.entryId, title: asset.entry.title })
            }
        })

        // 6. List files in public/uploads
        const uploadDir = join(process.cwd(), "public", "uploads")
        const trashDir = join(uploadDir, "trash")

        try {
            await mkdir(trashDir, { recursive: true })
        } catch (e) { }

        const files = await readdir(uploadDir)

        const mediaItems: any[] = []
        let movedCount = 0
        let totalSize = 0

        for (const file of files) {
            const filePath = join(uploadDir, file)
            const fileStat = await stat(filePath)

            if (fileStat.isDirectory()) continue

            const url = `/uploads/${file}`
            const sources = urlSources.get(url) || []
            const isReferenced = sources.length > 0

            if (!isReferenced) {
                const targetPath = join(trashDir, file)
                await rename(filePath, targetPath)
                movedCount++
                totalSize += fileStat.size
                mediaItems.push({
                    url,
                    status: 'unlinked',
                    sources: []
                })
            } else {
                mediaItems.push({
                    url,
                    status: 'referenced',
                    sources
                })
            }
        }

        return {
            success: true,
            message: `Cleanup complete. Moved ${movedCount} files (${(totalSize / 1024 / 1024).toFixed(2)} MB) to trash.`,
            movedCount,
            totalSizeFormatted: `${(totalSize / 1024 / 1024).toFixed(2)} MB`,
            mediaItems
        }

    } catch (error) {
        console.error("Media cleanup failed:", error)
        return { success: false, message: "Cleanup failed due to an error.", mediaItems: [] }
    }
}

/**
 * Optimizes the database by extracting Base64 images from entries and saving them as files.
 * This significantly speeds up search operations by removing massive blobs from the text indices.
 */
export async function optimizeDatabaseSearch() {
    const session = await auth()
    if (!isAdmin(session?.user?.email)) {
        return { success: false, message: "Unauthorized" }
    }

    try {
        const BATCH_SIZE = 50
        let skip = 0
        let optimizedCount = 0
        let totalImagesExtracted = 0
        let totalProcessed = 0

        while (true) {
            const batch = await prisma.entry.findMany({
                select: { id: true, content: true, title: true },
                skip: skip,
                take: BATCH_SIZE,
                orderBy: { createdAt: 'asc' }
            })

            if (batch.length === 0) break

            for (const entry of batch) {
                totalProcessed++
                if (!entry.content) continue

                let contentObj = entry.content
                let madeChanges = false

                const processString = async (s: string): Promise<string> => {
                    let result = s.replace(/\u0000/g, '')

                    // 2MB Truncation for junk
                    if (result.length > 2000000 && !result.includes(';base64,')) {
                        madeChanges = true
                        return result.substring(0, 1000) + "... [Massive data blob truncated safely]"
                    }

                    if (result.includes('data:') && result.includes(';base64,')) {
                        const matches: any[] = []
                        let pos = 0
                        while (true) {
                            const start = result.indexOf('data:', pos)
                            if (start === -1) break
                            const marker = ';base64,'
                            const markerIndex = result.indexOf(marker, start)
                            if (markerIndex === -1 || markerIndex > start + 150) {
                                pos = start + 5
                                continue
                            }

                            let end = -1
                            const potentialEnds = ['"', "'", " ", ">", "}", "]", "\\n", "\n"]
                            for (const char of potentialEnds) {
                                const idx = result.indexOf(char, markerIndex)
                                if (idx !== -1 && (end === -1 || idx < end)) end = idx
                            }
                            if (end === -1) end = result.length

                            const base64Data = result.substring(markerIndex + marker.length, end)
                            const fullMatch = result.substring(start, end)
                            matches.push({ full: fullMatch, mime: result.substring(start + 5, markerIndex), base64: base64Data })
                            pos = end
                        }

                        if (matches.length > 0) {
                            const uploadDir = join(process.cwd(), "public", "uploads")
                            await mkdir(uploadDir, { recursive: true })

                            for (const m of matches) {
                                if (m.base64.length > 100) {
                                    try {
                                        const cleanBase64 = m.base64.replace(/\\[nrt]/g, '').replace(/\\\//g, '/')
                                        const buffer = Buffer.from(cleanBase64, 'base64')
                                        const ext = m.mime.split('/')[1]?.split(';')[0]?.split('+')[0] || 'img'
                                        const filename = `opt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`
                                        await writeFile(join(uploadDir, filename), buffer)
                                        result = result.split(m.full).join(`/uploads/${filename}`)
                                        madeChanges = true
                                        totalImagesExtracted++
                                    } catch (e) { }
                                }
                            }
                        }
                    }
                    return result
                }

                const walker = async (obj: any): Promise<any> => {
                    if (!obj) return obj
                    if (Array.isArray(obj)) {
                        const results = await Promise.all(obj.map(item => walker(item)))
                        return results.filter(i => i !== null)
                    }
                    if (typeof obj === 'object') {
                        const newObj: any = {}
                        for (const [k, v] of Object.entries(obj)) newObj[k] = await walker(v)
                        return newObj
                    }
                    if (typeof obj === 'string') return await processString(obj)
                    return obj
                }

                const newContent = await walker(contentObj)

                if (madeChanges) {
                    await prisma.entry.update({
                        where: { id: entry.id },
                        data: { content: newContent }
                    })
                    optimizedCount++
                }
            }

            skip += BATCH_SIZE
            // Mandatory yield to keep server alive and allow GC to collect the old batch
            await new Promise(r => setTimeout(r, 100))
        }

        revalidatePath('/entries')
        return {
            success: true,
            message: `Optimization complete! Processed ${totalProcessed} entries, cleaned ${optimizedCount} entries, and extracted ${totalImagesExtracted} images.`
        }

    } catch (error) {
        console.error("Optimization failed:", error)
        return { success: false, message: "Optimization failed" }
    }
}

