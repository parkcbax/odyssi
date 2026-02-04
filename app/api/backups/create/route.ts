import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir, readFile } from "fs/promises"
import { join } from "path"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import AdmZip from "adm-zip"

export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await req.json()
        const { type, journalId, multipart, splitSize } = body

        // 1. Fetch Data
        let dataToBackup: any = {
            version: 1,
            timestamp: new Date().toISOString(),
            type,
            user: { id: session.user.id }
        }

        let entries = []
        let assets = []

        if (type === "JOURNAL") {
            if (!journalId) return NextResponse.json({ error: "Journal ID required" }, { status: 400 })
            const journal = await prisma.journal.findUnique({
                where: { id: journalId, userId: session.user.id },
                include: { entries: { include: { tags: true, images: true } } }
            })
            if (!journal) return NextResponse.json({ error: "Journal not found" }, { status: 404 })

            dataToBackup.journals = [journal]
            entries = journal.entries || []
        } else {
            // EVERYTHING
            const journals = await prisma.journal.findMany({
                where: { userId: session.user.id },
                include: { entries: { include: { tags: true, images: true } } }
            })
            const tags = await prisma.tag.findMany({ where: { userId: session.user.id } })

            dataToBackup.journals = journals
            dataToBackup.tags = tags

            // Collect all entries for asset processing
            for (const j of journals) {
                if (j.entries) entries.push(...j.entries)
            }

            // Fetch Blog Posts
            const blogPosts = await prisma.blogPost.findMany({
                where: { authorId: session.user.id }
            })
            dataToBackup.blogPosts = blogPosts
        }

        // 2. Prepare Zip
        const zip = new AdmZip()

        // Add JSON data
        zip.addFile("data.json", Buffer.from(JSON.stringify(dataToBackup, null, 2)))

        // 3. Add Images
        const uploadDir = join(process.cwd(), "public", "uploads")
        const imagesToAdd = new Set<string>()

        // From Journal Entries (using existing logic, but maybe entries have images relation issues? relying on what's there)
        for (const entry of entries) {
            if (entry.images && entry.images.length > 0) {
                for (const image of entry.images) {
                    imagesToAdd.add(image.url)
                }
            }
        }

        // From Blog Posts (Tiptap JSON)
        if (dataToBackup.blogPosts) {
            for (const post of dataToBackup.blogPosts) {
                if (post.content) {
                    // Extract images from Tiptap JSON
                    const extractImages = (node: any) => {
                        if (node.type === 'image' && node.attrs && node.attrs.src) {
                            imagesToAdd.add(node.attrs.src)
                        }
                        if (node.content && Array.isArray(node.content)) {
                            node.content.forEach(extractImages)
                        }
                    }
                    // Handle if content is the old simple JSON wrapper or Tiptap JSON
                    // Old: { type: "markdown", text: "..." } - no images usually
                    // Tiptap: { type: "doc", content: [...] }
                    if ((post.content as any).type === 'doc') {
                        extractImages(post.content)
                    }
                }
            }
        }

        for (const url of imagesToAdd) {
            try {
                // Image url is like /uploads/filename.jpg
                const filename = url.split('/').pop()
                if (filename) {
                    const filePath = join(uploadDir, filename)
                    const fileData = await readFile(filePath)
                    zip.addFile(`uploads/${filename}`, fileData)
                }
            } catch (e) {
                console.warn(`Failed to add image to backup: ${url}`, e)
            }
        }

        // 4. Save Backup
        const backupDir = join(process.cwd(), "backups")
        await mkdir(backupDir, { recursive: true })

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
        let baseFilename = `backup-${type}-${timestamp}.zip`

        if (type === "JOURNAL" && dataToBackup.journals && dataToBackup.journals.length === 1) {
            const journalTitle = dataToBackup.journals[0].title
            // Sanitize filename: remove non-alphanumeric chars (keep - and _)
            const safeTitle = journalTitle.replace(/[^a-z0-9-_]/gi, '_').substring(0, 30)
            baseFilename = `backup-JOURNAL-${safeTitle}-${timestamp}.zip`
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
                return NextResponse.json({ message: "Backup created successfully (Multipart)", parts: totalParts })
            }
        }

        // Single file
        await writeFile(join(backupDir, baseFilename), zipBuffer)

        return NextResponse.json({ message: "Backup created successfully", filename: baseFilename })

    } catch (error) {
        console.error("Backup creation error:", error)
        return NextResponse.json({ error: "Backup creation failed" }, { status: 500 })
    }
}
