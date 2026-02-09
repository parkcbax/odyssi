"use client"

import { NodeViewWrapper, NodeViewProps } from '@tiptap/react'
import { MapPin } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

// Reuse the EntryMap component but possibly scaled or styled differently
const EntryMap = dynamic(() => import('@/components/entry-map'), { ssr: false })

export default function LocationComponent(props: NodeViewProps) {
    const { lat, lng, label } = props.node.attrs

    // We can allow editing later, for now just display

    return (
        <NodeViewWrapper className="location-component my-4">
            <div className="border rounded-lg overflow-hidden bg-background shadow-sm">
                <div className="p-2 border-b flex items-center gap-2 bg-muted/30">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{label || "Pinned Location"}</span>
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
