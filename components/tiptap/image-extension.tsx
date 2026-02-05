
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import Image from '@tiptap/extension-image'
import { ImageWithLoader } from '@/components/ui/image-with-loader'

const ImageNode = (props: any) => {
    const { node, selected } = props

    return (
        <NodeViewWrapper className="image-script-wrapper" style={{ display: 'inline-block', maxWidth: '100%' }}>
            <ImageWithLoader
                src={node.attrs.src}
                alt={node.attrs.alt}
                title={node.attrs.title}
                className={selected ? 'ProseMirror-selectednode' : ''}
                containerClassName="rounded-md overflow-hidden"
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
