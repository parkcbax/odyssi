import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { generateBackup } from "@/app/lib/backup-service"

export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await req.json()
        const { type, journalId, multipart, splitSize, source } = body

        const result = await generateBackup({
            type,
            userId: session.user.id,
            journalId,
            multipart,
            splitSize,
            source: source || "MANUAL"
        })

        return NextResponse.json(result)

    } catch (error: any) {
        console.error("Backup creation error:", error)
        return NextResponse.json({ error: error.message || "Backup creation failed" }, { status: 500 })
    }
}
