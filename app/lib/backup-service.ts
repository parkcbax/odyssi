import { prisma } from "@/lib/prisma"
import AdmZip from "adm-zip"
import { writeFile, mkdir, readFile, stat, unlink } from "fs/promises"
import { join } from "path"
import { createWriteStream } from "fs"
import { PassThrough } from "stream"

export type BackupOptions = {
    type: "EVERYTHING" | "JOURNAL"
    userId?: string
    journalId?: string
    multipart?: boolean
    splitSize?: "250MB" | "500MB"
    source?: "MANUAL" | "AUTO"
}

export async function generateBackup(options: BackupOptions) {
    const { type, userId, journalId, multipart, splitSize, source = "MANUAL" } = options

    if (!userId && type === "JOURNAL") {
        throw new Error("UserId required for Journal backup")
    }

    const backupDir = join(process.cwd(), "backups")
    await mkdir(backupDir, { recursive: true })

    const timestamp = new Date().toISOString()
    const safeTimestamp = timestamp.replace(/[:.]/g, "-")

    const prefix = source === "AUTO" ? "auto-backup" : "backup"
    let baseFilename = `${prefix}-${type}-${safeTimestamp}.zip`

    const mediaToAdd = new Set<string>()
    const extractMedia = (node: any) => {
        // Handle Tiptap image, video, audio nodes
        if (['image', 'video', 'audio', 'file'].includes(node.type) && node.attrs && node.attrs.src) {
            mediaToAdd.add(node.attrs.src)
        }
        // Also handle generic 'src' in attrs if node type is something else but has a source
        if (node.attrs && node.attrs.src && typeof node.attrs.src === 'string') {
            mediaToAdd.add(node.attrs.src)
        }
        if (node.content && Array.isArray(node.content)) {
            node.content.forEach(extractMedia)
        }
    }

    if (type === "JOURNAL") {
        if (!journalId) throw new Error("Journal ID required")
        const j = await prisma.journal.findUnique({ where: { id: journalId, userId: userId } })
        if (!j) throw new Error("Journal not found")
        const safeTitle = j.title.replace(/[^a-z0-9-_]/gi, '_').substring(0, 30)
        baseFilename = `${prefix}-JOURNAL-${safeTitle}-${safeTimestamp}.zip`
        if (j.coverImage) mediaToAdd.add(j.coverImage)
    }

    const finalZipPath = join(backupDir, baseFilename)

    // 1. Prepare Zip Streaming (archiver)
    const output = createWriteStream(finalZipPath)
    const archive = require('archiver')('zip', {
        zlib: { level: 9 }, // Best compression
        statConcurrency: 1
    })

    // Setup the master promise to wait for ZIP completion
    const zipPromise = new Promise<void>((resolve, reject) => {
        output.on('close', resolve)
        archive.on('warning', (err: any) => { if (err.code !== 'ENOENT') reject(err) })
        archive.on('error', reject)
    })

    archive.pipe(output)

    // 2. Start JSON Streaming Directly into the Archive (No temporary disk file!)
    const jsonStream = new PassThrough()
    archive.append(jsonStream, { name: "data.json" })

    // Helper to write to JSON stream without memory flooding
    const writeStream = (data: string): Promise<void> => {
        return new Promise((resolve) => {
            if (!jsonStream.write(Buffer.from(data, 'utf-8'))) {
                jsonStream.once('drain', resolve)
            } else {
                resolve()
            }
        })
    }

    try {
        await writeStream(`{"version":1,"timestamp":"${timestamp}","type":"${type}","source":"${source}"`)
        if (userId) await writeStream(`,"user":{"id":"${userId}"}`)

        // JOURNALS
        await writeStream(`,"journals":[`)

        let journalsToProcess: any[] = []
        if (type === "JOURNAL") {
            const j = await prisma.journal.findUnique({ where: { id: journalId, userId: userId } })
            if (j) journalsToProcess = [j]
        } else {
            journalsToProcess = await prisma.journal.findMany({ where: userId ? { userId } : {} })
        }

        let isFirstJournal = true
        for (const j of journalsToProcess) {
            if (!isFirstJournal) await writeStream(`,`)
            isFirstJournal = false

            const { entries, ...journalInfo } = j as any
            let jString = JSON.stringify(journalInfo)
            jString = jString.substring(0, jString.length - 1)
            await writeStream(`${jString},"entries":[`)

            const BATCH_SIZE = 50
            let skip = 0
            let isFirstEntry = true

            while (true) {
                const batch = await prisma.entry.findMany({
                    where: { journalId: j.id },
                    include: { tags: true, images: true },
                    skip, take: BATCH_SIZE,
                    orderBy: { createdAt: 'asc' }
                })

                if (batch.length === 0) break

                for (const entry of batch) {
                    if (!isFirstEntry) await writeStream(`,`)
                    isFirstEntry = false
                    await writeStream(JSON.stringify(entry))

                    if (entry.images && entry.images.length > 0) {
                        for (const image of entry.images) mediaToAdd.add(image.url)
                    }
                    if (entry.content && (entry.content as any).type === 'doc') {
                        extractMedia(entry.content)
                    }
                }
                skip += BATCH_SIZE
            }
            await writeStream(`]}`) // close journal
        }
        await writeStream(`]`) // close journals array

        if (type !== "JOURNAL") {
            const whereUser = userId ? { userId } : {}

            // TAGS
            const tags = await prisma.tag.findMany({ where: whereUser })
            await writeStream(`,"tags":${JSON.stringify(tags)}`)

            // BLOG POSTS
            await writeStream(`,"blogPosts":[`)
            let skipBlog = 0
            let isFirstPost = true
            while (true) {
                const batch = await prisma.blogPost.findMany({
                    where: userId ? { authorId: userId } : {},
                    skip: skipBlog, take: 50
                })
                if (batch.length === 0) break
                for (const post of batch) {
                    if (!isFirstPost) await writeStream(`,`)
                    isFirstPost = false
                    await writeStream(JSON.stringify(post))
                    if (post.featuredImage) mediaToAdd.add(post.featuredImage)
                    if (post.content && (post.content as any).type === 'doc') {
                        extractMedia(post.content)
                    }
                }
                skipBlog += 50
            }
            await writeStream(`]`)

            // USERS
            if (!userId) {
                const users = await prisma.user.findMany()
                await writeStream(`,"users":${JSON.stringify(users)}`)
            }

            // APP CONFIG
            const appConfig = await prisma.appConfig.findFirst()
            if (appConfig) {
                await writeStream(`,"appConfig":${JSON.stringify(appConfig)}`)
            }
        }

        // Close global JSON and properly end stream to signal Archiver to move on
        await writeStream(`}`)
        jsonStream.end()

        // 3. Add Media Files to zip stream
        const uploadDir = join(process.cwd(), "public", "uploads")

        if (type === "EVERYTHING") {
            // Include THE ENTIRE UPLOADS DIRECTORY for EVERYTHING backup
            // This ensures no unreferenced files are lost, and covers all media types
            archive.directory(uploadDir, 'uploads')
        } else {
            // For JOURNAL backups, only include referenced media
            for (const url of mediaToAdd) {
                if (!url.startsWith('/uploads/')) continue
                const filename = url.split('/').pop()
                if (filename) {
                    const filePath = join(uploadDir, filename)
                    archive.file(filePath, { name: `uploads/${filename}` })
                }
            }
        }

        archive.finalize()

        // Wait for zip completely finishing
        await zipPromise

    } catch (e) {
        if (jsonStream) jsonStream.destroy()
        throw e
    }

    // 4. Handle Multipart Slicing (Streaming Disk to Disk)
    if (multipart) {
        const { statSync, createReadStream: readStr } = require('fs')
        const fileStat = statSync(finalZipPath, { bigint: true })
        const totalSize = Number(fileStat.size)
        const chunkSize = splitSize === '500MB' ? 500 * 1024 * 1024 : 250 * 1024 * 1024
        const totalParts = Math.ceil(totalSize / chunkSize)

        if (totalParts > 1) {
            for (let i = 0; i < totalParts; i++) {
                const start = Number(i) * chunkSize
                const end = Math.min(start + chunkSize, totalSize) - 1

                await new Promise<void>((resolve, reject) => {
                    const partFilename = `${baseFilename}.part${i + 1}`
                    const rs = readStr(finalZipPath, { start, end }) // We use raw chunk slices instead of memory buffers!
                    const ws = createWriteStream(join(backupDir, partFilename))
                    rs.pipe(ws)
                    ws.on('finish', resolve)
                    rs.on('error', reject)
                    ws.on('error', reject)
                })
            }

            // Delete original unified file
            await unlink(finalZipPath).catch(() => { })
            return { message: "Backup created successfully (Multipart)", parts: totalParts, filename: baseFilename }
        }
    }

    return { message: "Backup created successfully", filename: baseFilename }
}
