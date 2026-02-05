import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import Image from '@tiptap/extension-image'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'

const ImageNode = (props: any) => {
    const { node, selected } = props
    const [isLoading, setIsLoading] = useState(true)

    return (
        <NodeViewWrapper className="image-script-wrapper" style={{ display: 'inline-block', maxWidth: '100%', position: 'relative' }}>
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/50 backdrop-blur-sm z-10 rounded-md min-h-[100px] w-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            )}
            <img
                src={node.attrs.src}
                alt={node.attrs.alt}
                title={node.attrs.title}
                className={`rounded-md overflow-hidden max-w-full h-auto ${selected ? 'ring-2 ring-primary' : ''}`}
                onLoad={() => setIsLoading(false)}
            />
        </NodeViewWrapper>
    )
}

export const CustomImage = Image.extend({
    addNodeView() {
        return ReactNodeViewRenderer(ImageNode)
    },
    addAttributes() {
        return {
            ...this.parent?.(),
            width: {
                default: null,
            },
            height: {
                default: null,
            },
        }
    },
})
