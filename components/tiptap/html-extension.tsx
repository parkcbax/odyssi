import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { useState } from 'react'
import { Code, Eye, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'

const HTMLNodeView = (props: any) => {
    const { node, updateAttributes, selected, editor } = props
    const [isEditing, setIsEditing] = useState(editor.isEditable)

    const content = node.attrs.content || ''

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
                        className={cn(isEditing && editor.isEditable ? "" : "")}
                        dangerouslySetInnerHTML={{ __html: content || (editor.isEditable ? '<p class="text-muted-foreground italic text-sm text-center py-4">Empty HTML Block</p>' : '') }}
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
