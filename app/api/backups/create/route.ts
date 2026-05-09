import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { generateBackup } from "@/app/lib/backup-service"
import { isAdmin } from "@/lib/auth-utils"

export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await req.json()
        const { type, journalId, multipart, splitSize, source } = body

        // If user is Admin and backup type is EVERYTHING, don't pass userId to the generator.
        // This allows admins to perform a full system-wide backup (identical to AUTO backup) 
        // while regular users still only backup their own data.
        const userIsAdmin = isAdmin(session.user.email)
        const userIdToPass = (userIsAdmin && type === "EVERYTHING") ? undefined : session.user.id

        const result = await generateBackup({
            type,
            userId: userIdToPass,
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
