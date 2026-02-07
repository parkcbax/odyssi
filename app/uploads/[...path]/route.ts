
import { NextRequest, NextResponse } from "next/server"
import { readFile, stat } from "fs/promises"
import { join } from "path"
// import mime from "mime" - Removed to avoid dependency

// Simple mime map to avoid external dep for this critical fix if 'mime' isn't installed
const getMimeType = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase()
    switch (ext) {
        case 'png': return 'image/png'
        case 'jpg':
        case 'jpeg': return 'image/jpeg'
        case 'gif': return 'image/gif'
        case 'webp': return 'image/webp'
        case 'svg': return 'image/svg+xml'
        default: return 'application/octet-stream'
    }
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path } = await params
        const filename = path.join('/')

        // Security check: ensure no directory traversal
        if (filename.includes('..')) {
            return new NextResponse("Invalid path", { status: 400 })
        }

        const filePath = join(process.cwd(), "public", "uploads", filename)

        try {
            await stat(filePath)
        } catch (e) {
            return new NextResponse("File not found", { status: 404 })
        }

        const fileBuffer = await readFile(filePath)
        const contentType = getMimeType(filename)

        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=31536000, immutable"
            }
        })
    } catch (error) {
        console.error("Error serving file:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
