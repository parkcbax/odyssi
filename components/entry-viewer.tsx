"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { CustomImage } from '@/components/tiptap/image-extension'
import { CustomHTML } from '@/components/tiptap/html-extension'
import LinkExtension from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { CodeBlockComponent } from '@/components/tiptap/code-block-component'
import { LocationExtension } from '@/components/tiptap/location-extension'

import { all, createLowlight } from 'lowlight'
const lowlight = createLowlight(all)
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

import { MapPin } from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamically import map to avoid SSR issues with Leaflet
const EntryMap = dynamic(() => import('@/components/entry-map'), { ssr: false })

interface EntryViewerProps {
    content: any
    locationLat?: number | null
    locationLng?: number | null
    locationName?: string
}

export function EntryViewer({ content, locationLat, locationLng, locationName }: EntryViewerProps) {
    const editor = useEditor({
        editable: false,
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                codeBlock: false,
            }),
            CustomImage,
            CustomHTML,
            LinkExtension,
            Underline,
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            CodeBlockLowlight.configure({
                lowlight,
            }).extend({
                addNodeView() {
                    return ReactNodeViewRenderer(CodeBlockComponent)
                },
            }),
            LocationExtension,
        ],
        content: content,
        editorProps: {
            attributes: {
                class: 'prose prose-lg dark:prose-invert focus:outline-none max-w-none',
            },
        },
    })

    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return (
        <div className="space-y-6">
            <EditorContent editor={editor} />

            {typeof locationLat === 'number' && typeof locationLng === 'number' && (
                <div className="mt-8 border-t pt-8">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {locationName || "Location"}
                        </h3>
                        <div className="flex items-center gap-1">
                            {(() => {
                                const normalizedLng = ((locationLng % 360) + 540) % 360 - 180;

                                return (
                                    <>
                                        <button
                                            className="p-1.5 hover:bg-muted rounded-md text-muted-foreground transition-colors"
                                            onClick={(e) => {
                                                const btn = e.currentTarget;
                                                btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check text-green-500 h-3 w-3"><path d="M20 6 9 17l-5-5"/></svg>`;
                                                navigator.clipboard.writeText(`${locationLat}, ${normalizedLng}`)
                                                setTimeout(() => {
                                                    if (btn) {
                                                        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy h-3 w-3"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
                                                    }
                                                }, 2000)
                                            }}
                                            title="Copy GPS Location"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy h-3 w-3"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                                        </button>
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${locationLat},${normalizedLng}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            tabIndex={-1}
                                            className="p-1.5 hover:bg-muted rounded-md text-muted-foreground transition-colors"
                                            title="Open in Google Maps"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-external-link h-3 w-3"><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></svg>
                                        </a>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                    <div className="rounded-lg overflow-hidden border shadow-sm">
                        <EntryMap
                            key={`${locationLat}-${locationLng}`}
                            lat={locationLat}
                            lng={locationLng}
                            locationName={locationName || undefined}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
