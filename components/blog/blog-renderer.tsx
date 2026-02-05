"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { CustomImage } from '@/components/tiptap/image-extension'
import LinkExtension from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { useEffect, useState } from 'react'

export function BlogRenderer({ content }: { content: any }) {
    // If content looks like the old format { type: "markdown", text: "..." }, handle it or show text
    // But for Tiptap JSON, we pass it to editor.

    // Check if content is string and try to parse it (Tiptap JSON stored as string)
    let editorContent = content
    if (typeof content === 'string') {
        try {
            editorContent = JSON.parse(content)
        } catch {
            // keep as string
        }
    }

    // Check if old format (fallback)
    const isOldFormat = editorContent && typeof editorContent === 'object' && editorContent.type === 'markdown'
    if (isOldFormat) {
        // Double check: if the 'text' is actually a JSON string of a doc, parse it
        try {
            const nested = JSON.parse(editorContent.text)
            if (nested && nested.type === 'doc') {
                editorContent = nested
            } else {
                editorContent = editorContent.text || ''
            }
        } catch {
            editorContent = editorContent.text || ''
        }
    }

    const editor = useEditor({
        immediatelyRender: false,
        editable: false,
        extensions: [
            StarterKit,
            CustomImage,
            LinkExtension,
            Underline,
            TaskList,
            TaskItem,
        ],
        content: editorContent,
        editorProps: {
            attributes: {
                class: 'prose prose-lg dark:prose-invert max-w-none prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
            },
        },
    })

    const [mounted, setMounted] = useState(false)
    useEffect(() => { setMounted(true) }, [])

    if (!mounted) return null

    if (isOldFormat) {
        // Fallback for markdown/text content if needed, though Tiptap can render text too
        // If it was just text, Tiptap might parse it as paragraph.
        // But `content: editorContent` where it is string works for HTML/Text.
    }

    return <EditorContent editor={editor} />
}
