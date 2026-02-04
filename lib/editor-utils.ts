export function getContentSnippet(content: any): string {
    if (!content) return ""
    try {
        // Tiptap JSON content extraction
        const doc = typeof content === 'string' ? JSON.parse(content) : content
        let text = ""
        const traverse = (node: any) => {
            if (node.type === 'text') text += node.text
            if (node.content) node.content.forEach(traverse)
        }
        traverse(doc)
        return text
    } catch (e) {
        return ""
    }
}

export function getFirstImage(content: any): string | null {
    if (!content) return null
    try {
        const doc = typeof content === 'string' ? JSON.parse(content) : content
        let imageUrl: string | null = null
        const traverse = (node: any) => {
            if (imageUrl) return
            if (node.type === 'image') {
                imageUrl = node.attrs?.src
                return
            }
            if (node.content) node.content.forEach(traverse)
        }
        traverse(doc)
        return imageUrl
    } catch (e) {
        return null
    }
}
