import { NextRequest, NextResponse } from "next/server"
import { readFile, writeFile, mkdir, readdir } from "fs/promises"
import { join } from "path"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { isAdmin } from "@/lib/auth-utils"
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
        // Extract "uploads/" folder contents
        // Manual extraction to avoid EPERM: chmod errors on Docker volumes
        for (const entry of zipEntries) {
            if (entry.entryName.startsWith("uploads/") && !entry.isDirectory) {
                const targetName = entry.entryName.split('/').pop()
                if (targetName) {
                    try {
                        const content = entry.getData()
                        await writeFile(join(uploadDir, targetName), content)
                    } catch (e) {
                        console.error(`Failed to extract ${targetName}:`, e)
                    }
                }
            }
        }

        // 3. Database Restore
        // 3. Database Restore
        const userId = session.user.id

        if (data.type === "EVERYTHING") {
            const isUserAdmin = isAdmin(session.user.email)

            // SECURITY FIX: Verify session user actually exists in DB
            // If DB was reset (Docker restart), session token ID might be stale.
            const currentUser = await prisma.user.findUnique({
                where: { email: session.user.email || "" }
            })

            if (!currentUser) {
                return NextResponse.json({ error: "User record not found in database. Please re-login." }, { status: 401 })
            }

            const currentUserId = currentUser.id

            // WIPE and REPLACE
            await prisma.$transaction(async (tx) => {

                // 1. Maintain a map of Old User ID -> New User ID (for ID remapping)
                const userIdMap = new Map<string, string>()

                // Helper to get valid user ID
                const getValidUserId = (oldId: string) => {
                    if (userIdMap.has(oldId)) return userIdMap.get(oldId)
                    // Fallback to verified existing user ID
                    return currentUserId
                }

                // SYSTEM RESTORE LOGIC
                if (isUserAdmin && data.users && Array.isArray(data.users)) {
                    console.log("Performing System Restore (Admin)...")

                    // 2. Restore Users First
                    for (const user of data.users) {
                        // 1. Check if user exists by Email (Primary Match)
                        const existingByEmail = await tx.user.findUnique({ where: { email: user.email } })

                        let targetId = user.id

                        if (existingByEmail) {
                            // CASE A: User exists by Email. matches backup.
                            // We MUST use their existing ID.
                            targetId = existingByEmail.id

                            await tx.user.update({
                                where: { id: targetId },
                                data: {
                                    name: user.name,
                                    image: user.image,
                                    passwordHash: user.passwordHash,
                                    emailVerified: user.emailVerified,
                                    timezone: user.timezone,
                                    updatedAt: user.updatedAt ? new Date(user.updatedAt) : undefined
                                }
                            })
                        } else {
                            // User not found by email. 
                            // Check if their ID is taken by someone else?
                            const existingById = await tx.user.findUnique({ where: { id: user.id } })

                            if (existingById) {
                                // CASE B: ID exists, but Email specific to that ID is different (otherwise we would have matched by email above).
                                // We are restoring a user who has the SAME ID as someone in DB, but different email.
                                // We should overwrite this user to match our backup.
                                // Effectively, this changes the email of the user with this ID to the backup's email.
                                targetId = existingById.id

                                await tx.user.update({
                                    where: { id: targetId },
                                    data: {
                                        email: user.email, // CHANGE EMAIL
                                        name: user.name,
                                        image: user.image,
                                        passwordHash: user.passwordHash,
                                        emailVerified: user.emailVerified,
                                        timezone: user.timezone,
                                        updatedAt: user.updatedAt ? new Date(user.updatedAt) : undefined
                                    }
                                })
                            } else {
                                // CASE C: Neither Email nor ID exists. Clean create.
                                await tx.user.create({
                                    data: {
                                        id: user.id,
                                        name: user.name,
                                        email: user.email,
                                        passwordHash: user.passwordHash,
                                        timezone: user.timezone || "UTC",
                                        image: user.image,
                                        emailVerified: user.emailVerified,
                                        createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
                                        updatedAt: user.updatedAt ? new Date(user.updatedAt) : new Date()
                                    }
                                })
                            }
                        }

                        // Map old ID to valid target ID
                        userIdMap.set(user.id, targetId)
                    }

                    // 3. Clear existing data for these users
                    const validUserIds = Array.from(userIdMap.values())
                    if (validUserIds.length > 0) {
                        await tx.journal.deleteMany({ where: { userId: { in: validUserIds } } })
                        await tx.tag.deleteMany({ where: { userId: { in: validUserIds } } })
                        await tx.blogPost.deleteMany({ where: { authorId: { in: validUserIds } } })
                    }

                } else {
                    // Regular User Restore
                    await tx.journal.deleteMany({ where: { userId: currentUserId } })
                    await tx.tag.deleteMany({ where: { userId: currentUserId } })
                    await tx.blogPost.deleteMany({ where: { authorId: currentUserId } })
                }

                // Restore Tags
                if (data.tags) {
                    for (const tag of data.tags) {
                        const targetUserId = (isUserAdmin && tag.userId) ? getValidUserId(tag.userId) : currentUserId

                        await tx.tag.create({
                            data: {
                                id: tag.id,
                                name: tag.name,
                                user: { connect: { id: targetUserId } },
                            }
                        })
                    }
                }

                // Restore Journals & Entries
                if (data.journals) {
                    for (const j of data.journals) {
                        const targetUserId = (isUserAdmin && j.userId) ? getValidUserId(j.userId) : currentUserId

                        await tx.journal.create({
                            data: {
                                id: j.id,
                                title: j.title,
                                description: j.description,
                                color: j.color,
                                icon: j.icon,
                                user: { connect: { id: targetUserId } },
                                createdAt: j.createdAt ? new Date(j.createdAt) : new Date(),
                                updatedAt: j.updatedAt ? new Date(j.updatedAt) : new Date(),
                                entries: {
                                    create: j.entries ? j.entries.map((e: any) => ({
                                        id: e.id,
                                        title: e.title,
                                        content: e.content,
                                        date: e.date,
                                        mood: e.mood,
                                        locationName: e.locationName,
                                        createdAt: e.createdAt ? new Date(e.createdAt) : new Date(),
                                        updatedAt: e.updatedAt ? new Date(e.updatedAt) : new Date(),
                                        images: {
                                            create: e.images ? e.images.map((img: any) => ({
                                                id: img.id,
                                                url: img.url,
                                                type: img.type
                                            })) : []
                                        },
                                        tags: {
                                            connect: e.tags ? e.tags.map((t: any) => ({
                                                name_userId: { name: t.name, userId: targetUserId }
                                            })) : []
                                        }
                                    })) : []
                                }
                            }
                        })
                    }
                }

                // Restore Blog Posts
                if (data.blogPosts) {
                    for (const post of data.blogPosts) {
                        // For Blog Posts, 'authorId' is the key
                        const targetAuthorId = (isUserAdmin && post.authorId) ? getValidUserId(post.authorId) : currentUserId

                        await tx.blogPost.create({
                            data: {
                                id: post.id,
                                title: post.title,
                                slug: post.slug,
                                content: post.content,
                                published: post.published,
                                createdAt: post.createdAt ? new Date(post.createdAt) : new Date(),
                                updatedAt: post.updatedAt ? new Date(post.updatedAt) : new Date(),
                                author: { connect: { id: targetAuthorId } }
                            }
                        })
                    }
                }
                // Restore Global App Config (Singleton)
                if (data.appConfig) {
                    const existingConfig = await tx.appConfig.findFirst()

                    if (existingConfig) {
                        await tx.appConfig.update({
                            where: { id: existingConfig.id },
                            data: {
                                redirectHomeToLogin: data.appConfig.redirectHomeToLogin,
                                enableBlogging: data.appConfig.enableBlogging,
                                enableAutoBackup: data.appConfig.enableAutoBackup,
                                autoBackupInterval: data.appConfig.autoBackupInterval,
                                enableMultiUser: data.appConfig.enableMultiUser,
                                enableUserBlogging: data.appConfig.enableUserBlogging,
                                analyticSnippet: data.appConfig.analyticSnippet
                            }
                        })
                    } else {
                        await tx.appConfig.create({
                            data: {
                                id: data.appConfig.id, // Try to preserve ID if possible
                                redirectHomeToLogin: data.appConfig.redirectHomeToLogin,
                                enableBlogging: data.appConfig.enableBlogging,
                                enableAutoBackup: data.appConfig.enableAutoBackup,
                                autoBackupInterval: data.appConfig.autoBackupInterval,
                                enableMultiUser: data.appConfig.enableMultiUser,
                                enableUserBlogging: data.appConfig.enableUserBlogging,
                                analyticSnippet: data.appConfig.analyticSnippet
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
