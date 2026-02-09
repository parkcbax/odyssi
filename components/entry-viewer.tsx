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
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {locationName || "Location"}
                    </h3>
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
