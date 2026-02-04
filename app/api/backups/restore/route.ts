import { NextRequest, NextResponse } from "next/server"
import { readFile, writeFile, mkdir, readdir } from "fs/promises"
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
        const { filename } = body

        if (!filename) {
            return NextResponse.json({ error: "Filename required" }, { status: 400 })
        }

        const backupDir = join(process.cwd(), "backups")
        let fileBuffer: Buffer

        // Check if multipart
        // If filename ends with .zip.part1, we need to find all parts
        // Or if the UI sends the base name, we detect parts.
        // Let's assume the UI sends the specific file user clicked, or the base name.
        // Logic: if file exists, use it. If not, check for parts.

        const fullPath = join(backupDir, filename)

        // Simple multipart reassembly check
        // If it's a part file (e.g. .zip.part1), we assume user selected the first part
        // OR we can try to smart-find parts if it's a "virtual" entry.

        // For simplicity let's assume we look for [filename].part1, .part2 etc if correct file not found OR if explicitly multipart.
        // Actually, easiest is to just try to read the file. If it fails, check for parts.

        try {
            fileBuffer = await readFile(fullPath)
        } catch (e) {
            // Check for multipart reassembly
            // If filename is "backup.zip", look for "backup.zip.part1", "backup.zip.part2"...
            const dirFiles = await readdir(backupDir)
            const parts = dirFiles.filter(f => f.startsWith(filename + ".part")).sort()

            if (parts.length > 0) {
                const buffers = await Promise.all(parts.map(p => readFile(join(backupDir, p))))
                fileBuffer = Buffer.concat(buffers)
            } else {
                return NextResponse.json({ error: "Backup file not found" }, { status: 404 })
            }
        }

        // Unzip
        const zip = new AdmZip(fileBuffer)
        const zipEntries = zip.getEntries()

        // 1. Read Data
        const dataEntry = zipEntries.find(entry => entry.entryName === "data.json")
        if (!dataEntry) {
            return NextResponse.json({ error: "Invalid backup: missing data.json" }, { status: 400 })
        }

        const data = JSON.parse(dataEntry.getData().toString("utf8"))

        // Validation of user ownership (optional, but good practice if we want to prevent restoring others data? 
        // Though prompt says 'restore EVERYTHING' implies full restore.
        // Assuming single user per dashboard context or user is restoring their own stuff.)

        // 2. Restore Images
        const uploadDir = join(process.cwd(), "public", "uploads")
        await mkdir(uploadDir, { recursive: true })

        // Extract "uploads/" folder contents
        zipEntries.forEach(entry => {
            if (entry.entryName.startsWith("uploads/") && !entry.isDirectory) {
                const targetName = entry.entryName.split('/').pop()
                if (targetName) {
                    zip.extractEntryTo(entry, uploadDir, false, true)
                }
            }
        })

        // 3. Database Restore
        // 3. Database Restore
        const userId = session.user.id

        if (data.type === "EVERYTHING") {
            // WIPE and REPLACE
            await prisma.$transaction(async (tx) => {
                // Delete all user data
                await tx.journal.deleteMany({ where: { userId } })
                await tx.tag.deleteMany({ where: { userId } })

                // Restore Tags
                if (data.tags) {
                    for (const tag of data.tags) {
                        await tx.tag.create({
                            data: {
                                id: tag.id,
                                name: tag.name,
                                userId
                            }
                        })
                    }
                }

                // Restore Journals & Entries
                if (data.journals) {
                    for (const j of data.journals) {
                        await tx.journal.create({
                            data: {
                                id: j.id,
                                title: j.title,
                                description: j.description,
                                color: j.color,
                                icon: j.icon,
                                userId,
                                createdAt: j.createdAt,
                                entries: {
                                    create: j.entries ? j.entries.map((e: any) => ({
                                        id: e.id,
                                        title: e.title,
                                        content: e.content,
                                        date: e.date,
                                        mood: e.mood,
                                        locationName: e.locationName,
                                        createdAt: e.createdAt,
                                        images: {
                                            create: e.images ? e.images.map((img: any) => ({
                                                id: img.id,
                                                url: img.url,
                                                type: img.type
                                            })) : []
                                        },
                                        tags: {
                                            connect: e.tags ? e.tags.map((t: any) => ({
                                                name_userId: { name: t.name, userId }
                                            })) : []
                                        }
                                    })) : []
                                }
                            }
                        })
                    }
                }
            })

        } else if (data.type === "JOURNAL") {
            // Single Journal Restore with Conflict Check
            const journalsToRestore = data.journals || []

            for (const j of journalsToRestore) {
                let title = j.title

                // Check conflict
                const existing = await prisma.journal.findFirst({
                    where: { title: title, userId }
                })

                if (existing) {
                    title = `${title} - Restored ${new Date().toLocaleDateString().replace(/\//g, '-')}`
                    let counter = 2
                    while (await prisma.journal.findFirst({ where: { title: `${j.title}-${counter}`, userId } })) {
                        counter++
                    }
                    title = `${j.title}-${counter}`
                }

                await prisma.journal.create({
                    data: {
                        // New ID generated automatically
                        title: title,
                        description: j.description,
                        color: j.color,
                        icon: j.icon,
                        userId,
                        entries: {
                            create: j.entries ? j.entries.map((e: any) => ({
                                // New Entry ID
                                title: e.title,
                                content: e.content,
                                date: e.date,
                                mood: e.mood,
                                locationName: e.locationName,
                                images: {
                                    create: e.images ? e.images.map((img: any) => ({
                                        url: img.url,
                                        type: img.type
                                    })) : []
                                },
                                // Tags are shared, so connectOrCreate
                                tags: {
                                    connectOrCreate: e.tags ? e.tags.map((t: any) => ({
                                        where: { name_userId: { name: t.name, userId } },
                                        create: { name: t.name, userId }
                                    })) : []
                                }
                            })) : []
                        }
                    }
                })
            }
        }

        return NextResponse.json({ message: "Restore successful" })

    } catch (error) {
        console.error("Restore error:", error)
        return NextResponse.json({ error: "Restore failed" }, { status: 500 })
    }
}
