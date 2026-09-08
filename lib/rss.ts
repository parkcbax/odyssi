import Parser from "rss-parser"
import sanitizeHtml from "sanitize-html"

export interface RssArticle {
    id: string
    title: string
    link: string
    content: string
    excerpt: string
    imageUrl?: string
    sourceTitle: string
    sourceUrl?: string
    category?: string
    pubDate?: string
    author?: string
}

export const DEFAULT_FEEDS = [
    {
        title: "BBC News - World",
        url: "https://feeds.bbci.co.uk/news/world/rss.xml",
        category: "News"
    },
    {
        title: "The Verge",
        url: "https://www.theverge.com/rss/index.xml",
        category: "Tech"
    },
    {
        title: "TechCrunch",
        url: "https://techcrunch.com/feed/",
        category: "Tech"
    }
]

// Security: Validate URLs to prevent SSRF against internal/private networks
export function isValidPublicHttpUrl(urlString: string): boolean {
    try {
        const url = new URL(urlString)
        if (url.protocol !== "http:" && url.protocol !== "https:") {
            return false
        }
        const hostname = url.hostname.toLowerCase()

        // Block localhost, link-local, loopback, internal domains
        if (
            hostname === "localhost" ||
            hostname === "127.0.0.1" ||
            hostname === "::1" ||
            hostname === "0.0.0.0" ||
            hostname.endsWith(".local") ||
            hostname.endsWith(".internal") ||
            hostname === "postgres" ||
            hostname.includes("odyssi")
        ) {
            return false
        }

        // Block IPv4 private ranges (10.x.x.x, 172.16-31.x.x, 192.168.x.x, 169.254.x.x)
        const ipParts = hostname.split(".").map(p => parseInt(p, 10))
        if (ipParts.length === 4 && ipParts.every(p => !isNaN(p) && p >= 0 && p <= 255)) {
            if (ipParts[0] === 10) return false
            if (ipParts[0] === 127) return false
            if (ipParts[0] === 169 && ipParts[1] === 254) return false
            if (ipParts[0] === 172 && ipParts[1] >= 16 && ipParts[1] <= 31) return false
            if (ipParts[0] === 192 && ipParts[1] === 168) return false
            if (ipParts[0] === 0) return false
        }

        return true
    } catch {
        return false
    }
}

// Extract image URL from feed item
function extractImageUrl(item: any): string | undefined {
    // 1. Enclosure image
    if (item.enclosure?.url && (item.enclosure.type?.startsWith("image/") || item.enclosure.url.match(/\.(jpeg|jpg|gif|png|webp)/i))) {
        return item.enclosure.url
    }

    // 2. Media content or thumbnail (common in RSS/Atom)
    if (item['media:content']?.$?.url) {
        return item['media:content'].$.url
    }
    if (item['media:thumbnail']?.$?.url) {
        return item['media:thumbnail'].$.url
    }

    // 3. Look into HTML content or description for <img> tag
    const rawHtml = item['content:encoded'] || item.content || item.description || item.summary || ""
    const imgMatch = rawHtml.match(/<img[^>]+src=["']([^"']+)["']/i)
    if (imgMatch && imgMatch[1]) {
        const src = imgMatch[1]
        if (src.startsWith("http://") || src.startsWith("https://")) {
            return src
        }
    }

    return undefined
}

// Clean & sanitize HTML content safely
export function sanitizeArticleContent(rawHtml: string): string {
    if (!rawHtml) return ""
    return sanitizeHtml(rawHtml, {
        allowedTags: [
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
            'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
            'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'img', 'figure', 'figcaption'
        ],
        allowedAttributes: {
            a: ['href', 'name', 'target', 'rel'],
            img: ['src', 'alt', 'title', 'width', 'height', 'loading', 'referrerpolicy'],
            '*': ['class']
        },
        allowedSchemes: ['http', 'https'],
        transformTags: {
            a: (tagName, attribs) => ({
                tagName: 'a',
                attribs: {
                    ...attribs,
                    target: '_blank',
                    rel: 'noopener noreferrer'
                }
            }),
            img: (tagName, attribs) => {
                let src = attribs.src || ''
                if (src && (src.startsWith('http://') || src.startsWith('https://'))) {
                    src = `/api/proxy/image?url=${encodeURIComponent(src)}`
                }
                return {
                    tagName: 'img',
                    attribs: {
                        ...attribs,
                        src,
                        loading: 'lazy',
                        referrerpolicy: 'no-referrer',
                        class: 'rounded-lg max-h-96 w-auto object-cover my-4'
                    }
                }
            }
        }
    })
}

// Helper to make plain text excerpt
function makeExcerpt(raw: string, length: number = 220): string {
    if (!raw) return ""
    const text = raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
    if (text.length <= length) return text
    return text.substring(0, length) + "..."
}

const parser = new Parser({
    customFields: {
        item: [
            ['media:content', 'media:content'],
            ['media:thumbnail', 'media:thumbnail'],
            ['content:encoded', 'content:encoded'],
        ]
    }
})

export async function fetchFeed(url: string, feedTitle?: string, feedCategory?: string, customTimeoutMs: number = 360000): Promise<RssArticle[]> {
    if (!isValidPublicHttpUrl(url)) {
        throw new Error("Invalid or prohibited feed URL")
    }

    try {
        // Use native fetch with extended timeout (default 6 minutes) for slow LLM/webhook feeds
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), customTimeoutMs)

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OdyssiFeedReader/1.0",
                "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8"
            }
        })
        clearTimeout(timeoutId)

        if (!response.ok) {
            console.error(`Feed fetch HTTP error ${response.status} from ${url}`)
            return []
        }

        const xmlText = await response.text()
        if (!xmlText || xmlText.trim().length === 0) {
            console.warn(`Empty feed response from ${url}`)
            return []
        }

        const feed = await parser.parseString(xmlText)
        const sourceName = feedTitle || feed.title || new URL(url).hostname
        const categoryName = feedCategory || "General"

        return (feed.items || []).slice(0, 30).map((item: any, index: number) => {
            const rawBody = item['content:encoded'] || item.content || item.summary || item.contentSnippet || item.description || ""
            const imageUrl = extractImageUrl(item)
            const cleanContent = sanitizeArticleContent(rawBody)
            const excerpt = makeExcerpt(item.contentSnippet || rawBody)

            const link = item.link || `${url}#${index}`
            const id = Buffer.from(link).toString('base64url').substring(0, 32)

            return {
                id,
                title: item.title?.trim() || "Untitled Article",
                link,
                content: cleanContent || excerpt,
                excerpt: excerpt || "No description provided.",
                imageUrl,
                sourceTitle: sourceName,
                sourceUrl: url,
                category: categoryName,
                pubDate: item.isoDate || item.pubDate || new Date().toISOString(),
                author: item.creator || (item as any).author
            }
        })
    } catch (error: any) {
        if (error?.name === "AbortError") {
            console.error(`Feed fetch timeout (${customTimeoutMs / 1000}s) exceeded for ${url}`)
        } else {
            console.error(`Failed to fetch RSS from ${url}:`, error?.message || error)
        }
        return []
    }
}

