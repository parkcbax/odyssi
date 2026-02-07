import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import Image from '@tiptap/extension-image'
import { useState } from 'react'
import { Loader2, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const ImageNode = (props: any) => {
    const { node, selected, updateAttributes, editor } = props
    const [isLoading, setIsLoading] = useState(true)

    const width = node.attrs.width || '100%'
    const align = node.attrs.align || 'center'

    const containerStyle: React.CSSProperties = {
        width: width.includes('%') ? width : `${width}%`,
        maxWidth: '100%',
        position: 'relative',
        display: 'block',
        marginLeft: align === 'left' ? '0' : align === 'right' ? 'auto' : 'auto',
        marginRight: align === 'right' ? '0' : align === 'left' ? 'auto' : 'auto',
    }

    return (
        <NodeViewWrapper className="image-node-wrapper py-4" style={containerStyle}>
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/50 backdrop-blur-sm z-10 rounded-md min-h-[100px] w-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            )}
            <div className="relative group">
                <img
                    src={node.attrs.src}
                    alt={node.attrs.alt}
                    title={node.attrs.title}
                    className={cn(
                        "rounded-md overflow-hidden w-full h-auto transition-all",
                        (selected && editor.isEditable) ? 'ring-2 ring-primary ring-offset-2' : ''
                    )}
                    onLoad={() => setIsLoading(false)}
                />

                {selected && editor.isEditable && (
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 bg-background border rounded-lg shadow-xl z-20">
                        <div className="flex items-center border-r pr-1 mr-1">
                            <button
                                onClick={() => updateAttributes({ align: 'left' })}
                                className={cn("p-1.5 rounded hover:bg-muted transition-colors", align === 'left' && "bg-primary/10 text-primary")}
                                title="Align Left"
                            >
                                <AlignLeft className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => updateAttributes({ align: 'center' })}
                                className={cn("p-1.5 rounded hover:bg-muted transition-colors", align === 'center' && "bg-primary/10 text-primary")}
                                title="Align Center"
                            >
                                <AlignCenter className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => updateAttributes({ align: 'right' })}
                                className={cn("p-1.5 rounded hover:bg-muted transition-colors", align === 'right' && "bg-primary/10 text-primary")}
                                title="Align Right"
                            >
                                <AlignRight className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="flex items-center gap-1 px-1">
                            {['25', '50', '75', '100'].map((w) => (
                                <button
                                    key={w}
                                    onClick={() => updateAttributes({ width: w })}
                                    className={cn(
                                        "px-2 py-1 text-[10px] font-bold rounded hover:bg-muted transition-colors",
                                        (width === w || width === `${w}%`) && "bg-primary/10 text-primary"
                                    )}
                                >
                                    {w}%
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
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
                default: '100%',
                renderHTML: attributes => {
                    const widthValue = attributes.width || '100%'
                    return {
                        width: widthValue,
                        style: `width: ${widthValue}${widthValue.toString().includes('%') ? '' : '%'};`,
                    }
                },
            },
            align: {
                default: 'center',
                renderHTML: attributes => {
                    const alignValue = attributes.align || 'center'
                    return {
                        'data-align': alignValue,
                        style: `margin-left: ${alignValue === 'left' ? '0' : 'auto'}; margin-right: ${alignValue === 'right' ? '0' : 'auto'}; display: block;`,
                    }
                },
            },
        }
    },
})

