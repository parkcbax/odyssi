'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export interface SearchResult {
    id: string
    title: string
    date: Date
    journal: {
        title: string
        color: string
        icon: string | null
    }
    snippet: string
}

export async function searchEntries(query: string): Promise<SearchResult[]> {
    const session = await auth()
    if (!session?.user?.id) return []

    if (!query || query.trim().length === 0) return []

    const searchTerm = query.trim()
    const searchPattern = `%${searchTerm}%`

    try {
        // Use raw query to effectively search JSON content cast to text
        // This is a robust way to search within the stringified JSON stored by Tiptap
        const entries = await prisma.$queryRaw`
            SELECT 
                e.id, 
                e.title, 
                e.date, 
                e.content,
                j.title as "journalTitle",
                j.color as "journalColor",
                j.icon as "journalIcon"
            FROM "Entry" e
            JOIN "Journal" j ON e."journalId" = j.id
            WHERE j."userId" = ${session.user.id}
            AND (
                e.title ILIKE ${searchPattern}
                OR
                e.content::text ILIKE ${searchPattern}
            )
            ORDER BY e.date DESC
            LIMIT 50
        ` as any[]

        // Process results to add snippets/highlights
        return entries.map(entry => {
            const result: SearchResult = {
                id: entry.id,
                title: entry.title,
                date: new Date(entry.date),
                journal: {
                    title: entry.journalTitle,
                    color: entry.journalColor,
                    icon: entry.journalIcon
                },
                snippet: ""
            }

            // Highlighting Logic
            // 1. Check title
            // Note: We'll leave title highlighting to the UI, 
            // but we need to generate a text snippet from content if the match is in the content.

            // 2. Check content
            let contentText = ""
            if (typeof entry.content === 'object' && entry.content !== null) {
                // Approximate extraction from Tiptap JSON
                contentText = extractTextFromTiptap(entry.content)
            } else if (typeof entry.content === 'string') {
                contentText = entry.content
            }

            // Find match in content
            const lowerContent = contentText.toLowerCase()
            const lowerQuery = searchTerm.toLowerCase()
            const index = lowerContent.indexOf(lowerQuery)

            if (index !== -1) {
                // Extract window around match
                const start = Math.max(0, index - 40)
                const end = Math.min(contentText.length, index + searchTerm.length + 40)
                let snippet = contentText.substring(start, end)

                if (start > 0) snippet = "..." + snippet
                if (end < contentText.length) snippet = snippet + "..."

                result.snippet = snippet
            } else {
                // If match only in title, just show start of content
                result.snippet = contentText.substring(0, 100) + (contentText.length > 100 ? "..." : "")
            }

            return result
        })

    } catch (error) {
        console.error("Search failed:", error)
        return []
    }
}

// Helper to extract text from Tiptap JSON node
function extractTextFromTiptap(node: any): string {
    if (!node) return ""
    if (typeof node === 'string') return node

    let text = ""

    if (node.type === 'text' && node.text) {
        text += node.text
    }

    if (node.content && Array.isArray(node.content)) {
        node.content.forEach((child: any) => {
            text += extractTextFromTiptap(child) + " "
        })
    }

    return text.trim()
}
