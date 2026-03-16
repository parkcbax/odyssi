export function getContentSnippet(content: any): string {
    if (!content) return ""
    try {
        // Tiptap JSON content extraction
        const doc = typeof content === 'string' ? JSON.parse(content) : content
        let text = ""
        const traverse = (node: any) => {
            if (node.type === 'text') text += node.text + " "
            if (node.type === 'customHTML' && node.attrs?.content) {
                // Strip massive base64 images FIRST before running the expensive HTML tag regex
                const withoutBase64 = node.attrs.content.replace(/src="data:image\/[^;]+;base64,[^"]+"/gi, '')
                const htmlText = withoutBase64.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim()
                text += htmlText + " "
            }
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
export function getAllImages(content: any): string[] {
    if (!content) return []
    try {
        const doc = typeof content === 'string' ? JSON.parse(content) : content
        const images: string[] = []
        const traverse = (node: any) => {
            if (node.type === 'image' && node.attrs?.src) {
                images.push(node.attrs.src)
            }
            if (node.content) node.content.forEach(traverse)
        }
        traverse(doc)
        return images
    } catch (e) {
        return []
    }
}
