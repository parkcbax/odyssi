import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { auth } from "@/auth"

export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const formData = await req.formData()
        const file = formData.get("file") as File

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Ensure upload directory exists
        const uploadDir = join(process.cwd(), "public", "uploads")
        try {
            await mkdir(uploadDir, { recursive: true })
        } catch (e) {
            // Directory might already exist
        }

        const filename = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`
        const path = join(uploadDir, filename)

        await writeFile(path, buffer)

        const url = `/uploads/${filename}`
        return NextResponse.json({ url })
    } catch (error) {
        console.error("Upload error:", error)
        return NextResponse.json({ error: "Upload failed" }, { status: 500 })
    }
}
