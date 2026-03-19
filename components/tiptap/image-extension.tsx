import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import Image from '@tiptap/extension-image'
import { useState, useRef } from 'react'
import { Loader2, AlignLeft, AlignCenter, AlignRight, ScanText, FileText, Check, X, RotateCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createWorker, PSM } from 'tesseract.js'

// Preprocessing helper to apply contrast & grayscale
const preprocessImage = (src: string, rotation: number = 0): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new window.Image()
        img.crossOrigin = 'Anonymous'
        img.onload = () => {
            const canvas = document.createElement('canvas')
            
            if (rotation === 90 || rotation === 270) {
                canvas.width = img.height
                canvas.height = img.width
            } else {
                canvas.width = img.width
                canvas.height = img.height
            }

            const ctx = canvas.getContext('2d')
            if (!ctx) {
                return resolve(src)
            }

            // Draw original image with rotation
            ctx.translate(canvas.width / 2, canvas.height / 2)
            ctx.rotate((rotation * Math.PI) / 180)
            ctx.drawImage(img, -img.width / 2, -img.height / 2)

            // Apply grayscale and contrast stretch
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const data = imageData.data

            for (let i = 0; i < data.length; i += 4) {
                // Grayscale
                const avg = (data[i] + data[i + 1] + data[i + 2]) / 3

                // Simple thresholding for better text contrast (dark text on light bg)
                const color = avg > 140 ? 255 : 0 // Adjust threshold if needed

                data[i] = color     // R
                data[i + 1] = color // G
                data[i + 2] = color // B
            }

            ctx.putImageData(imageData, 0, 0)
            resolve(canvas.toDataURL('image/png'))
        }
        img.onerror = () => resolve(src) // Fallback on error
        img.src = src
    })
}

const ImageNode = (props: any) => {
    const { node, selected, updateAttributes, editor } = props
    const [isLoading, setIsLoading] = useState(true)
    const [isScanning, setIsScanning] = useState(false)
    const [showOcrEditor, setShowOcrEditor] = useState(false)
    const [ocrEditValue, setOcrEditValue] = useState(node.attrs.ocrText || '')

    const width = node.attrs.width || '100%'
    const align = node.attrs.align || 'center'

    const handleOcr = async () => {
        if (!node.attrs.src || isScanning) return
        setIsScanning(true)
        try {
            // First apply image preprocessing and rotation
            const processedSrc = await preprocessImage(node.attrs.src, node.attrs.rotation || 0)

            // Run Tesseract with both Thai and English
            const worker = await createWorker(['tha', 'eng'])

            // Set Page Segmentation Mode to Single Block (often better for text blocks/handwriting layout)
            await worker.setParameters({
                tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
            })

            const ret = await worker.recognize(processedSrc)
            updateAttributes({ ocrText: ret.data.text })
            setOcrEditValue(ret.data.text)
            await worker.terminate()
        } catch (error) {
            console.error("OCR Error:", error)
            alert("Failed to extract text from image.")
        } finally {
            setIsScanning(false)
        }
    }

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
                    style={{ transform: `rotate(${node.attrs.rotation || 0}deg)` }}
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
                                onClick={() => updateAttributes({ rotation: ((node.attrs.rotation || 0) + 90) % 360 })}
                                className="p-1.5 rounded hover:bg-muted transition-colors mr-1"
                                title="Rotate 90°"
                            >
                                <RotateCw className="h-4 w-4" />
                            </button>
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
                        <div className="flex items-center border-r pr-1 mr-1 gap-1">
                            <button
                                onClick={handleOcr}
                                disabled={isScanning}
                                className={cn("p-1.5 rounded hover:bg-muted transition-colors", isScanning && "opacity-50 cursor-not-allowed")}
                                title="Extract Thai Text (OCR)"
                            >
                                {isScanning ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <ScanText className="h-4 w-4" />}
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

                {node.attrs.ocrText && !showOcrEditor && (
                    <div
                        className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded-md shadow flex items-center gap-1 cursor-pointer hover:bg-primary/90 transition-colors z-10"
                        onClick={() => setShowOcrEditor(true)}
                        title="View extracted text"
                    >
                        <FileText className="h-3 w-3" />
                        <span>OCR</span>
                    </div>
                )}

                {showOcrEditor && (
                    <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-30 p-4 flex flex-col rounded-md border shadow-lg m-2">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-primary" />
                                <span className="text-sm font-semibold">Extracted Text</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        updateAttributes({ ocrText: ocrEditValue })
                                        setShowOcrEditor(false)
                                    }}
                                    className="p-1 hover:bg-muted rounded text-green-600"
                                    title="Save"
                                >
                                    <Check className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => {
                                        setOcrEditValue(node.attrs.ocrText || '')
                                        setShowOcrEditor(false)
                                    }}
                                    className="p-1 hover:bg-muted rounded text-muted-foreground"
                                    title="Cancel"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                        <textarea
                            value={ocrEditValue}
                            onChange={(e) => setOcrEditValue(e.target.value)}
                            className="flex-1 w-full bg-transparent border rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                            placeholder="Extracted text will appear here..."
                        />
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
            ocrText: {
                default: null,
                parseHTML: element => element.getAttribute('data-ocr-text'),
                renderHTML: attributes => {
                    if (!attributes.ocrText) {
                        return {}
                    }
                    return {
                        'data-ocr-text': attributes.ocrText,
                    }
                },
            },
            rotation: {
                default: 0,
                parseHTML: element => parseInt(element.getAttribute('data-rotation') || '0', 10),
                renderHTML: attributes => {
                    if (!attributes.rotation) {
                        return {}
                    }
                    return {
                        'data-rotation': attributes.rotation,
                        style: `transform: rotate(${attributes.rotation}deg);`,
                    }
                },
            },
        }
    },
})

