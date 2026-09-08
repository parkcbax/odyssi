import { NextRequest, NextResponse } from "next/server"
import { syncAllFeeds } from "@/lib/rss-sync"

export async function GET(req: NextRequest) {
    // Auth: require CRON_SECRET header (internal cron only). Reject otherwise.
    const secret = process.env.CRON_SECRET
    const provided = req.headers.get('x-cron-secret') || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    if (!secret || !provided || provided !== secret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const result = await syncAllFeeds()
        return NextResponse.json({
            message: "News feed sync completed",
            ...result
        })
    } catch (error: any) {
        console.error("News feed cron sync error:", error)
        return NextResponse.json({ error: error?.message || "Sync failed" }, { status: 500 })
    }
}
