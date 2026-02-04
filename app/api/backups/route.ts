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
        const backups = await Promise.all(
            files.map(async (file) => {
                if (!file.endsWith(".zip")) return null

                const filePath = join(backupDir, file)
                const fileStat = await stat(filePath)

                return {
                    name: file,
                    size: fileStat.size,
                    createdAt: fileStat.birthtime
                }
            })
        )

        const validBackups = backups.filter(Boolean).sort((a, b) => b!.createdAt.getTime() - a!.createdAt.getTime())

        return NextResponse.json({ backups: validBackups })
    } catch (error) {
        console.error("Failed to list backups:", error)
        // If directory doesn't exist, return empty list
        return NextResponse.json({ backups: [] })
    }
}
