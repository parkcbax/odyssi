import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { useState, useEffect, useRef } from 'react'
import { Code, Eye, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'

const HTMLNodeView = (props: any) => {
    const { node, updateAttributes, selected, editor } = props
    const [isEditing, setIsEditing] = useState(editor.isEditable)
    const content = node.attrs.content || ''
    const [processedContent, setProcessedContent] = useState(content)

    useEffect(() => {
        if (isEditing) {
            setProcessedContent(content);
            return;
        }

        let newContent = content;
        const urlsToRevoke: string[] = [];

        // Match both Base64 and /uploads/*.pdf URLs in <object data="...">
        const pdfRegex = /<object[^>]+data="([^"]+(?:application\/pdf;base64|(?:\/uploads\/.*\.pdf)))"[^>]*>/g;
        let match;

        while ((match = pdfRegex.exec(content)) !== null) {
            const dataUri = match[1];
            const isBase64 = dataUri.includes('base64');

            if (isBase64 && dataUri.length > 500000) {
                try {
                    const base64Data = dataUri.split(',')[1];
                    const byteCharacters = atob(base64Data);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], { type: 'application/pdf' });
                    const blobUrl = URL.createObjectURL(blob);

                    newContent = newContent.replace(match[0], `<iframe src="${blobUrl}" style="width: 100%; height: 800px; min-height: 800px; border: none;"></iframe>`);
                    urlsToRevoke.push(blobUrl);
                } catch (e) {
                    console.error("Failed to convert large PDF to Blob URL", e);
                }
            } else {
                // For small base64 or optimized /uploads/ paths
                newContent = newContent.replace(match[0], `<iframe src="${dataUri}" style="width: 100%; height: 800px; min-height: 800px; border: none;"></iframe>`);
            }
        }

        // Clean up any remaining closing tags if replacement was partial (though regex above replaces the whole opening tag)
        newContent = newContent.replace(/<\/object>/g, '');

        setProcessedContent(newContent);

        return () => {
            urlsToRevoke.forEach((url: string) => URL.revokeObjectURL(url));
        };
    }, [content, isEditing]);

    return (
        <NodeViewWrapper className={cn(
            "custom-html-node my-6 transition-all",
            editor.isEditable ? "border rounded-lg overflow-hidden" : "",
            (selected && editor.isEditable) ? "ring-2 ring-primary border-transparent" : ""
        )}>
            {editor.isEditable && (
                <div className="flex items-center justify-between bg-muted/50 px-3 py-1.5 border-b text-xs font-medium text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Code className="h-3.5 w-3.5" />
                        <span>Custom HTML Block</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setIsEditing(true)}
                            className={cn(
                                "px-2 py-0.5 rounded transition-colors",
                                isEditing ? "bg-background text-foreground shadow-sm" : "hover:bg-background/50"
                            )}
                        >
                            <Pencil className="h-3 w-3 inline mr-1" />
                            Edit
                        </button>
                        <button
                            onClick={() => setIsEditing(false)}
                            className={cn(
                                "px-2 py-0.5 rounded transition-colors",
                                !isEditing ? "bg-background text-foreground shadow-sm" : "hover:bg-background/50"
                            )}
                        >
                            <Eye className="h-3 w-3 inline mr-1" />
                            Preview
                        </button>
                    </div>
                </div>
            )}

            <div className="p-0">
                {isEditing && editor.isEditable ? (
                    <textarea
                        className="w-full min-h-[150px] p-4 font-mono text-sm bg-background focus:outline-none resize-y"
                        value={content}
                        onChange={(e) => updateAttributes({ content: e.target.value })}
                        placeholder="Paste your custom HTML here (e.g. iframe, scripts, etc.)"
                    />
                ) : (
                    <div
                        className={cn(
                            isEditing && editor.isEditable ? "" : "",
                            "[&_object]:w-full [&_object]:h-[800px] [&_iframe]:w-full [&_iframe]:h-[800px]"
                        )}
                        dangerouslySetInnerHTML={{ __html: processedContent || (editor.isEditable ? '<p class="text-muted-foreground italic text-sm text-center py-4">Empty HTML Block</p>' : '') }}
                    />
                )}
            </div>
        </NodeViewWrapper>
    )
}

export const CustomHTML = Node.create({
    name: 'customHTML',
    group: 'block',
    atom: true,
    selectable: true,
    draggable: true,

    addAttributes() {
        return {
            content: {
                default: '',
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="custom-html"]',
            },
        ]
    },

    renderHTML({ node, HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'custom-html' }), node.attrs.content]
    },

    addNodeView() {
        return ReactNodeViewRenderer(HTMLNodeView)
    },
})
