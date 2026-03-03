import { NextRequest, NextResponse } from "next/server"
import { readdir, stat } from "fs/promises"
import { join } from "path"
import { auth } from "@/auth"

export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const backupDir = join(process.cwd(), "backups")

    try {
        const files = await readdir(backupDir)
        const fileMap = new Map<string, any>()

        for (const file of files) {
            const filePath = join(backupDir, file)
            const fileStat = await stat(filePath)

            const isZip = file.endsWith(".zip")
            const isPart = file.match(/\.part\d+$/)

            if (!isZip && !isPart) continue

            if (isZip) {
                fileMap.set(file, {
                    name: file,
                    size: fileStat.size,
                    createdAt: fileStat.birthtime,
                    isMultipart: false
                })
            } else if (isPart) {
                const baseName = file.replace(/\.part\d+$/, "")

                if (fileMap.has(baseName)) {
                    const existing = fileMap.get(baseName)
                    existing.size += fileStat.size
                    existing.parts = (existing.parts || 1) + 1
                    existing.isMultipart = true
                    // Use earliest creation time across parts
                    if (fileStat.birthtime < existing.createdAt) {
                        existing.createdAt = fileStat.birthtime
                    }
                } else {
                    fileMap.set(baseName, {
                        name: baseName,
                        size: fileStat.size,
                        createdAt: fileStat.birthtime,
                        parts: 1,
                        isMultipart: true
                    })
                }
            }
        }

        const validBackups = Array.from(fileMap.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

        return NextResponse.json({ backups: validBackups })
    } catch (error) {
        console.error("Failed to list backups:", error)
        // If directory doesn't exist, return empty list
        return NextResponse.json({ backups: [] })
    }
}
