import { prisma } from "@/lib/prisma"
import AdmZip from "adm-zip"
import { writeFile, mkdir, readFile } from "fs/promises"
import { join } from "path"

export type BackupOptions = {
    type: "EVERYTHING" | "JOURNAL"
    userId?: string // If provided, filters by user. If null, might imply system-wide (future)
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

    // 1. Fetch Data
    let dataToBackup: any = {
        version: 1,
        timestamp: new Date().toISOString(),
        type,
        source,
        user: userId ? { id: userId } : undefined
    }

    let entries = []

    // Logic similar to original route
    if (type === "JOURNAL") {
        if (!journalId) throw new Error("Journal ID required")
        const journal = await prisma.journal.findUnique({
            where: { id: journalId, userId: userId }, // enforcing user check if provided
            include: { entries: { include: { tags: true, images: true } } }
        })
        if (!journal) throw new Error("Journal not found")

        dataToBackup.journals = [journal]
        entries = journal.entries || []
    } else {
        // EVERYTHING
        const whereUser = userId ? { userId } : {}

        const journals = await prisma.journal.findMany({
            where: whereUser,
            include: { entries: { include: { tags: true, images: true } } }
        })
        const tags = await prisma.tag.findMany({ where: whereUser })

        dataToBackup.journals = journals
        dataToBackup.tags = tags

        // Collect all entries
        for (const j of journals) {
            if (j.entries) entries.push(...j.entries)
        }

        // Fetch Blog Posts
        const blogPosts = await prisma.blogPost.findMany({
            where: userId ? { authorId: userId } : {}
        })
        dataToBackup.blogPosts = blogPosts

        // Fetch Users (only for System Backup i.e., no specific userId filter)
        if (!userId) {
            const users = await prisma.user.findMany()
            dataToBackup.users = users
        }
    }

    // 2. Prepare Zip
    const zip = new AdmZip()
    zip.addFile("data.json", Buffer.from(JSON.stringify(dataToBackup, null, 2)))

    // 3. Add Images
    const uploadDir = join(process.cwd(), "public", "uploads")
    const imagesToAdd = new Set<string>()

    // From Journal Entries
    // From Journal Entries
    for (const entry of entries) {
        // 1. From Asset relation (if used)
        if (entry.images && entry.images.length > 0) {
            for (const image of entry.images) {
                imagesToAdd.add(image.url)
            }
        }

        // 2. From Content JSON (Tiptap)
        if (entry.content && (entry.content as any).type === 'doc') {
            const extractImages = (node: any) => {
                if (node.type === 'image' && node.attrs && node.attrs.src) {
                    imagesToAdd.add(node.attrs.src)
                }
                if (node.content && Array.isArray(node.content)) {
                    node.content.forEach(extractImages)
                }
            }
            extractImages(entry.content)
        }
    }

    // From Blog Posts
    if (dataToBackup.blogPosts) {
        for (const post of dataToBackup.blogPosts) {
            if (post.content) {
                const extractImages = (node: any) => {
                    if (node.type === 'image' && node.attrs && node.attrs.src) {
                        imagesToAdd.add(node.attrs.src)
                    }
                    if (node.content && Array.isArray(node.content)) {
                        node.content.forEach(extractImages)
                    }
                }
                if ((post.content as any).type === 'doc') {
                    extractImages(post.content)
                }
            }
        }
    }

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

    // 4. Save Backup
    const backupDir = join(process.cwd(), "backups")
    await mkdir(backupDir, { recursive: true })

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const prefix = source === "AUTO" ? "auto-backup" : "backup"

    let baseFilename = `${prefix}-${type}-${timestamp}.zip`

    if (type === "JOURNAL" && dataToBackup.journals && dataToBackup.journals.length === 1) {
        const journalTitle = dataToBackup.journals[0].title
        const safeTitle = journalTitle.replace(/[^a-z0-9-_]/gi, '_').substring(0, 30)
        baseFilename = `${prefix}-JOURNAL-${safeTitle}-${timestamp}.zip`
    }

    const zipBuffer = zip.toBuffer()

    if (multipart) {
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
    }

    await writeFile(join(backupDir, baseFilename), zipBuffer)
    return { message: "Backup created successfully", filename: baseFilename }
}
