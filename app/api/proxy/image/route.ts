import { NextRequest, NextResponse } from "next/server"
import { isValidPublicHttpUrl } from "@/lib/rss"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const targetUrl = searchParams.get("url")

    if (!targetUrl || !isValidPublicHttpUrl(targetUrl)) {
        return new NextResponse("Invalid URL", { status: 400 })
    }

    try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        const response = await fetch(targetUrl, {
            signal: controller.signal,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9,th;q=0.8"
            }
        })
        clearTimeout(timeoutId)

        if (!response.ok) {
            return new NextResponse(`Upstream image error: ${response.status}`, { status: response.status })
        }

        const contentType = response.headers.get("content-type") || "image/jpeg"
        const buffer = await response.arrayBuffer()

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
            }
        })
    } catch (error: any) {
        return new NextResponse(`Proxy error: ${error?.message || error}`, { status: 502 })
    }
}
