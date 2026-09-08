import { isValidPublicHttpUrl, sanitizeArticleContent } from "./rss"

/**
 * Fetch and extract the main article content (readability / full article parser)
 * from the target web URL.
 */
export async function extractFullArticleContent(url: string): Promise<{
    content: string
    title?: string
    byline?: string
    error?: string
}> {
    if (!isValidPublicHttpUrl(url)) {
        return { content: "", error: "Invalid URL" }
    }

    try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 12000) // 12s timeout

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OdyssiReader/1.0",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9,th;q=0.8"
            }
        })
        clearTimeout(timeoutId)

        if (!response.ok) {
            return { content: "", error: `HTTP ${response.status}` }
        }

        const html = await response.text()
        if (!html) {
            return { content: "", error: "Empty response" }
        }

        // Clean out script, style, nav, header, footer, noscript tags
        const cleanedHtml = html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
            .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, "")
            .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, "")
            .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, "")
            .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, "")

        // 1. Try to locate <article> or [role="main"] or .article-body or main content block
        let mainContent = ""
        const articleMatch = cleanedHtml.match(/<article[\s\S]*?<\/article>/i)
        const mainTagMatch = cleanedHtml.match(/<main[\s\S]*?<\/main>/i)

        if (articleMatch && articleMatch[0].length > 300) {
            mainContent = articleMatch[0]
        } else if (mainTagMatch && mainTagMatch[0].length > 300) {
            mainContent = mainTagMatch[0]
        } else {
            // Fallback: collect paragraphs
            const paragraphs = cleanedHtml.match(/<p[\s\S]*?<\/p>/gi)
            if (paragraphs && paragraphs.length > 0) {
                mainContent = paragraphs.filter(p => {
                    const text = p.replace(/<[^>]+>/g, "").trim()
                    return text.length > 40
                }).join("\n")
            }
        }

        if (!mainContent) {
            return { content: "", error: "Could not extract article body" }
        }

        const sanitized = sanitizeArticleContent(mainContent)
        return { content: sanitized }
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Fetch error"
        return { content: "", error: msg }
    }
}
