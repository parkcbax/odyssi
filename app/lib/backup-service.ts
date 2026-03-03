import { prisma } from "@/lib/prisma"
import AdmZip from "adm-zip"
import { writeFile, mkdir, readFile, stat, unlink } from "fs/promises"
import { join } from "path"
import { createWriteStream } from "fs"

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

    const tempJsonPath = join(backupDir, `temp_data_${safeTimestamp}.json`)

    const writer = createWriteStream(tempJsonPath)

    // Write helper
    const writeStream = (data: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (!writer.write(data)) {
                writer.once('drain', resolve)
            } else {
                resolve()
            }
        })
    }

    const imagesToAdd = new Set<string>()
    const extractImages = (node: any) => {
        if (node.type === 'image' && node.attrs && node.attrs.src) {
            imagesToAdd.add(node.attrs.src)
        }
        if (node.content && Array.isArray(node.content)) {
            node.content.forEach(extractImages)
        }
    }

    // 1. Start JSON Streaming
    await writeStream(`{"version":1,"timestamp":"${timestamp}","type":"${type}","source":"${source}"`)
    if (userId) await writeStream(`,"user":{"id":"${userId}"}`)

    // JOURNALS
    await writeStream(`,"journals":[`)

    let journalsToProcess: any[] = []
    if (type === "JOURNAL") {
        if (!journalId) throw new Error("Journal ID required")
        const j = await prisma.journal.findUnique({ where: { id: journalId, userId: userId } })
        if (!j) throw new Error("Journal not found")
        journalsToProcess = [j]

        const safeTitle = j.title.replace(/[^a-z0-9-_]/gi, '_').substring(0, 30)
        baseFilename = `${prefix}-JOURNAL-${safeTitle}-${safeTimestamp}.zip`
    } else {
        journalsToProcess = await prisma.journal.findMany({ where: userId ? { userId } : {} })
    }

    let isFirstJournal = true
    for (const j of journalsToProcess) {
        if (!isFirstJournal) await writeStream(`,`)
        isFirstJournal = false

        // Write journal info minus entries
        const { entries, ...journalInfo } = j as any

        // Start journal object
        let jString = JSON.stringify(journalInfo)
        jString = jString.substring(0, jString.length - 1) // pop closing bracket
        await writeStream(`${jString},"entries":[`)

        // Paginate entries
        const BATCH_SIZE = 50
        let skip = 0
        let isFirstEntry = true

        while (true) {
            const batch = await prisma.entry.findMany({
                where: { journalId: j.id },
                include: { tags: true, images: true },
                skip,
                take: BATCH_SIZE,
                orderBy: { createdAt: 'asc' }
            })

            if (batch.length === 0) break

            for (const entry of batch) {
                if (!isFirstEntry) await writeStream(`,`)
                isFirstEntry = false
                await writeStream(JSON.stringify(entry))

                // Collect images
                if (entry.images && entry.images.length > 0) {
                    for (const image of entry.images) imagesToAdd.add(image.url)
                }
                if (entry.content && (entry.content as any).type === 'doc') {
                    extractImages(entry.content)
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
        let skip = 0
        let isFirstPost = true
        while (true) {
            const batch = await prisma.blogPost.findMany({
                where: userId ? { authorId: userId } : {},
                skip, take: 50
            })
            if (batch.length === 0) break
            for (const post of batch) {
                if (!isFirstPost) await writeStream(`,`)
                isFirstPost = false
                await writeStream(JSON.stringify(post))
                if (post.content && (post.content as any).type === 'doc') {
                    extractImages(post.content)
                }
            }
            skip += 50
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

    // Close global JSON
    await writeStream(`}`)
    writer.end()

    await new Promise((resolve) => writer.on('finish', resolve))

    // 2. Prepare Zip
    const zip = new AdmZip()
    zip.addLocalFile(tempJsonPath, "", "data.json")

    // 3. Add Images
    const uploadDir = join(process.cwd(), "public", "uploads")
    for (const url of imagesToAdd) {
        try {
            const filename = url.split('/').pop()
            if (filename) {
                const filePath = join(uploadDir, filename)
                const fileData = await readFile(filePath)
                zip.addFile(`uploads/${filename}`, fileData)
            }
        } catch (e) {
            // console.warn(`Failed to add image to backup: ${url}`, e)
        }
    }

    // 4. Save Backup efficiently
    const finalZipPath = join(backupDir, baseFilename)

    if (multipart) {
        // Build to buffer explicitly since slicing is requested
        // Though memory-heavy, it's what was requested
        const zipBuffer = zip.toBuffer()
        const chunkSize = splitSize === '500MB' ? 500 * 1024 * 1024 : 250 * 1024 * 1024
        const totalSize = zipBuffer.length
        const totalParts = Math.ceil(totalSize / chunkSize)

        if (totalParts > 1) {
            for (let i = 0; i < totalParts; i++) {
                const start = i * chunkSize
                const end = Math.min(start + chunkSize, totalSize)
                const chunk = zipBuffer.subarray(start, end)
                const partFilename = `${baseFilename}.part${i + 1}`

                await writeFile(join(backupDir, partFilename), chunk)
            }
            return { message: "Backup created successfully (Multipart)", parts: totalParts, filename: baseFilename }
        }
        // Fallthrough saves full zip if parts = 1
    }

    // Use the native promise write which avoids massive unified memory buffers in node
    await zip.writeZipPromise(finalZipPath)

    // Cleanup temporary JSON to free disk
    await unlink(tempJsonPath).catch(() => { })

    return { message: "Backup created successfully", filename: baseFilename }
}
