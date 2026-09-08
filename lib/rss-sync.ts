import { prisma } from "./prisma"
import { fetchFeed, isValidPublicHttpUrl } from "./rss"

export interface SyncFeedResult {
    totalFeeds: number
    syncedFeeds: number
    totalArticlesSynced: number
    errors: { feedUrl: string; error: string }[]
}

/**
 * Background worker sync function to fetch all active RSS feeds and cache them to FeedArticleCache.
 * Allows longer timeout (e.g. 60-120s per feed) so slow feeds won't block users.
 */
export async function syncAllFeeds(forceAll: boolean = false): Promise<SyncFeedResult> {
    const feeds = await prisma.rssFeed.findMany({
        orderBy: { createdAt: "desc" }
    })

    const result: SyncFeedResult = {
        totalFeeds: feeds.length,
        syncedFeeds: 0,
        totalArticlesSynced: 0,
        errors: []
    }

    if (feeds.length === 0) {
        return result
    }

    const now = new Date()

    console.log(`[RSS Sync] Starting sync for ${feeds.length} feeds (forceAll=${forceAll})...`)

    // Process feeds in batches/settled promises
    const feedPromises = feeds.map(async (feed) => {
        try {
            if (!isValidPublicHttpUrl(feed.url)) {
                result.errors.push({ feedUrl: feed.url, error: "Invalid URL" })
                return
            }

            // Check if feed is due for fetching based on fetchInterval
            if (!forceAll && feed.lastFetchedAt) {
                const diffMs = now.getTime() - new Date(feed.lastFetchedAt).getTime()
                const interval = feed.fetchInterval || "15M"
                let intervalMs = 15 * 60 * 1000 // default 15M

                switch (interval) {
                    case "15M":
                        intervalMs = 15 * 60 * 1000
                        break
                    case "1H":
                        intervalMs = 60 * 60 * 1000
                        break
                    case "6H":
                        intervalMs = 6 * 60 * 60 * 1000
                        break
                    case "12H":
                        intervalMs = 12 * 60 * 60 * 1000
                        break
                    case "1D":
                        intervalMs = 24 * 60 * 60 * 1000
                        break
                    default:
                        intervalMs = 15 * 60 * 1000
                }

                // If not due yet, skip
                if (diffMs < intervalMs) {
                    return
                }
            }

            // fetch feed articles with 6-minute timeout
            const articles = await fetchFeed(feed.url, feed.title, feed.category || "General")
            
            // Always record lastFetchedAt
            await prisma.rssFeed.update({
                where: { id: feed.id },
                data: { lastFetchedAt: now }
            }).catch(() => {})

            if (!articles || articles.length === 0) {
                return
            }

            let insertedCount = 0
            for (const article of articles) {
                try {
                    const pubDateObj = article.pubDate ? new Date(article.pubDate) : new Date()

                    await prisma.feedArticleCache.upsert({
                        where: { link: article.link },
                        create: {
                            link: article.link,
                            title: article.title,
                            content: article.content,
                            excerpt: article.excerpt,
                            imageUrl: article.imageUrl,
                            sourceTitle: article.sourceTitle,
                            sourceUrl: article.sourceUrl || feed.url,
                            category: article.category || feed.category || "General",
                            pubDate: isNaN(pubDateObj.getTime()) ? null : pubDateObj,
                            author: article.author,
                            feedId: feed.id
                        },
                        update: {
                            title: article.title,
                            content: article.content,
                            excerpt: article.excerpt,
                            imageUrl: article.imageUrl,
                            sourceTitle: article.sourceTitle,
                            category: article.category || feed.category || "General",
                            pubDate: isNaN(pubDateObj.getTime()) ? null : pubDateObj,
                            author: article.author,
                            feedId: feed.id
                        }
                    })
                    insertedCount++
                } catch {
                    // Ignore single article duplicate or parse error
                }
            }

            result.syncedFeeds++
            result.totalArticlesSynced += insertedCount
            console.log(`[RSS Sync] Synced ${insertedCount} articles from: ${feed.title}`)
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Sync failed"
            console.error(`[RSS Sync] Failed to sync ${feed.url}:`, msg)
            result.errors.push({ feedUrl: feed.url, error: msg })
        }
    })


    await Promise.allSettled(feedPromises)

    // Housekeeping: Clean up articles older than 14 days to keep DB fast and light
    try {
        const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
        const deleted = await prisma.feedArticleCache.deleteMany({
            where: {
                createdAt: {
                    lt: fourteenDaysAgo
                }
            }
        })
        if (deleted.count > 0) {
            console.log(`[RSS Sync] Pruned ${deleted.count} old cached articles.`)
        }
    } catch (cleanupErr) {
        console.error("[RSS Sync] Failed pruning old articles:", cleanupErr)
    }

    console.log(`[RSS Sync] Completed: ${result.syncedFeeds}/${result.totalFeeds} feeds, ${result.totalArticlesSynced} articles.`)
    return result
}

