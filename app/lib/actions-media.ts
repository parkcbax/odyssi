'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { isAdmin } from "@/lib/auth-utils"
import { readdir, mkdir, rename, stat } from "fs/promises"
import { join } from "path"
import { revalidatePath } from "next/cache"

/**
 * Recursively extracts all image URLs starting with /uploads/ from a Tiptap JSON object.
 */
function extractUploadsFromJson(json: any, urls: Map<string, any[]>, source: { type: string, id: string, title: string }) {
    if (!json || typeof json !== 'object') return

    if (json.type === 'image' && json.attrs?.src?.startsWith('/uploads/')) {
        const url = json.attrs.src
        if (!urls.has(url)) urls.set(url, [])
        urls.get(url)?.push(source)
    }

    if (Array.isArray(json)) {
        json.forEach(item => extractUploadsFromJson(item, urls, source))
    } else {
        Object.values(json).forEach(value => extractUploadsFromJson(value, urls, source))
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
