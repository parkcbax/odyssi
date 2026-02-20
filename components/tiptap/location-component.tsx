"use client"

import { NodeViewWrapper, NodeViewProps } from '@tiptap/react'
import { MapPin, Copy, ExternalLink, Check } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

// Reuse the EntryMap component but possibly scaled or styled differently
const EntryMap = dynamic(() => import('@/components/entry-map'), { ssr: false })

export default function LocationComponent(props: NodeViewProps) {
    const { lat, lng: rawLng, label } = props.node.attrs
    // Normalize longitude to be between -180 and 180 (Leaflet Maps can return outside this range if user wraps around)
    const lng = ((rawLng % 360) + 540) % 360 - 180;

    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        navigator.clipboard.writeText(`${lat}, ${lng}`)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // We can allow editing later, for now just display

    return (
        <NodeViewWrapper className="location-component my-4">
            <div className="border rounded-lg overflow-hidden bg-background shadow-sm">
                <div className="p-2 border-b flex items-center justify-between bg-muted/30">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{label || "Pinned Location"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={handleCopy}
                            title="Copy GPS Location"
                        >
                            {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
                        </Button>
                        <a
                            href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            tabIndex={-1}
                        >
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                title="Open in Google Maps"
                                type="button"
                            >
                                <ExternalLink className="h-3 w-3 text-muted-foreground" />
                            </Button>
                        </a>
                    </div>
                </div>
                <div className="h-[200px] w-full relative">
                    {/* 
                       We render the map if coordinates exist.
                       Using key to force re-render if coords change 
                     */}
                    <EntryMap
                        key={`${lat}-${lng}`}
                        lat={lat}
                        lng={lng}
                        locationName={label}
                        className="h-full w-full"
                    />
                    {/* Overlay to prevent map interaction stealing focus from editor if needed, 
                         but EntryMap already has dragging={false} so it might be fine.
                         However, Tiptap sometimes needs help with selection.
                     */}
                </div>
            </div>
        </NodeViewWrapper>
    )
}
