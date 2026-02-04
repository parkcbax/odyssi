
// Helper to extract text from Tiptap JSON
export function getExcerpt(content: any): string {
    if (!content) return ""

    // If content is string, try to parse it as JSON first (Tiptap content might be stored as stringified JSON)
    if (typeof content === 'string') {
        try {
            const parsed = JSON.parse(content)
            // If successful, treat it as object
            return getExcerpt(parsed)
        } catch {
            // If not valid JSON, treat as plain text
            return content.substring(0, 150) + (content.length > 150 ? "..." : "")
        }
    }

    // Handle legacy format { type: "markdown", text: "..." }
    if (content.text && typeof content.text === 'string' && content.type === 'markdown') {
        try {
            const nested = JSON.parse(content.text)
            if (nested && nested.type === 'doc') {
                return getExcerpt(nested)
            }
        } catch { }
        return content.text.substring(0, 150) + (content.text.length > 150 ? "..." : "")
    }

    // Handle Tiptap JSON
    try {
        let text = ""
        const traverse = (node: any) => {
            if (node.type === 'text' && typeof node.text === 'string') {
                text += node.text
            }

            const isBlock = ['paragraph', 'heading', 'blockquote', 'bulletList', 'orderedList', 'listItem'].includes(node.type)

            if (node.content && Array.isArray(node.content)) {
                node.content.forEach(traverse)
            }

            if (isBlock) {
                text += " "
            }
        }

        // Tiptap doc usually starts with type: 'doc'
        if (content.type === 'doc' || Array.isArray(content.content)) {
            traverse(content)
            // Clean up multiple spaces
            const cleanText = text.replace(/\s+/g, ' ').trim()
            return cleanText.substring(0, 150) + (cleanText.length > 150 ? "..." : "")
        }
    } catch (e) {
        console.error("Excerpt generation error", e)
        return ""
    }

    return ""
}
