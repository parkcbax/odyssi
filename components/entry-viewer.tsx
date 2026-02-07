"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { CustomImage } from '@/components/tiptap/image-extension'
import { CustomHTML } from '@/components/tiptap/html-extension'
import LinkExtension from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface EntryViewerProps {
    content: any
}

export function EntryViewer({ content }: EntryViewerProps) {
    const editor = useEditor({
        editable: false,
        immediatelyRender: false,
        extensions: [
            StarterKit,
            CustomImage,
            CustomHTML,
            LinkExtension,
            Underline,
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
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

    return <EditorContent editor={editor} />
}
