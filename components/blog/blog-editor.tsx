"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import LinkExtension from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import CharacterCount from '@tiptap/extension-character-count'
import { useState, useEffect, forwardRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    List,
    ListTodo,
    Heading1,
    Heading2,
    Quote,
    Image as ImageIcon,
    Link as LinkIcon,
    Loader2,
    Save
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { createBlogPost, updateBlogPost } from '@/app/lib/actions'
// ... (imports remain)

// ...



interface BlogEditorProps {
    initialData?: {
        id?: string
        title: string
        slug?: string
        category?: string
        content: any
        excerpt?: string
        featuredImage?: string
        keywords?: string
        published: boolean
    }
}

export function BlogEditor({ initialData }: BlogEditorProps) {
    const router = useRouter()

    const [title, setTitle] = useState(initialData?.title || '')
    const [slug, setSlug] = useState(initialData?.slug || '')
    const [category, setCategory] = useState(initialData?.category || '')
    const [excerpt, setExcerpt] = useState(initialData?.excerpt || '')
    const [featuredImage, setFeaturedImage] = useState(initialData?.featuredImage || '')
    const [keywords, setKeywords] = useState(initialData?.keywords || '')
    const [published, setPublished] = useState(initialData?.published || false)
    const [isSaving, setIsSaving] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [isUploadingFeatured, setIsUploadingFeatured] = useState(false)

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'Write your story...',
                emptyEditorClass: 'is-editor-empty before:content-[attr(data-placeholder)] before:text-muted-foreground before:float-left before:pointer-events-none',
            }),
            Image,
            LinkExtension.configure({ openOnClick: false }),
            Underline,
            TaskList,
            TaskItem.configure({ nested: true }),
            CharacterCount,
        ],
        content: initialData?.content || '',
        editorProps: {
            attributes: {
                class: 'prose prose-lg dark:prose-invert focus:outline-none max-w-none min-h-[300px]',
            },
        },
    })

    const [mounted, setMounted] = useState(false)
    useEffect(() => { setMounted(true) }, [])

    if (!mounted) return null

    const wordCount = editor?.storage.characterCount.words() || 0

    const handleSave = async () => {
        if (!title) {
            alert("Please add a title")
            return
        }
        if (!editor) return

        setIsSaving(true)
        const content = editor.getJSON()

        const formData = new FormData()
        formData.append('title', title)
        formData.append('slug', slug)
        formData.append('category', category)
        formData.append('content', JSON.stringify(content)) // Send JSON string
        formData.append('excerpt', excerpt)
        formData.append('featuredImage', featuredImage)
        formData.append('keywords', keywords)
        formData.append('published', published ? "on" : "off")

        if (initialData?.id) {
            formData.append('id', initialData.id)
            await updateBlogPost(null, formData)
        } else {
            await createBlogPost(null, formData)
        }

        // Action redirects, but if we need to handle error/success explicitly here:
        // For now relying on action redirect. 
        // Although createBlogPost redirects, we might want to catch it or just wait.
        // Actually actions that redirect will throw an error if called from client? No.
        // But if redirect happens, this component will unmount.
        // If we want updates to verify, we'll see.
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !editor) return

        setIsUploading(true)
        const formData = new FormData()
        formData.append("file", file)

        try {
            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            })

            const data = await response.json()
            if (data.url) {
                editor.chain().focus().setImage({ src: data.url }).run()
            } else {
                alert("Upload failed")
            }
        } catch (error) {
            console.error("Upload error:", error)
            alert("Upload failed")
        } finally {
            setIsUploading(false)
            e.target.value = ""
        }
    }

    const setLink = () => {
        if (!editor) return
        const previousUrl = editor.getAttributes("link").href
        const url = window.prompt("URL", previousUrl)

        if (url === null) return

        if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run()
            return
        }

        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
    }

    return (
        <div className="flex flex-col h-full min-h-[500px]">
            {/* Toolbar */}
            <div className="flex items-center justify-between py-4 border-b bg-background sticky top-0 z-10">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                    <ToolbarButton onClick={() => editor?.chain().focus().toggleBold().run()} isActive={editor?.isActive('bold')}><Bold className="h-4 w-4" /></ToolbarButton>
                    <ToolbarButton onClick={() => editor?.chain().focus().toggleItalic().run()} isActive={editor?.isActive('italic')}><Italic className="h-4 w-4" /></ToolbarButton>
                    <ToolbarButton onClick={() => editor?.chain().focus().toggleUnderline().run()} isActive={editor?.isActive('underline')}><UnderlineIcon className="h-4 w-4" /></ToolbarButton>
                    <div className="w-px h-6 bg-border mx-1" />
                    <ToolbarButton onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor?.isActive('heading', { level: 1 })}><Heading1 className="h-4 w-4" /></ToolbarButton>
                    <ToolbarButton onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor?.isActive('heading', { level: 2 })}><Heading2 className="h-4 w-4" /></ToolbarButton>
                    <div className="w-px h-6 bg-border mx-1" />
                    <ToolbarButton onClick={() => editor?.chain().focus().toggleBulletList().run()} isActive={editor?.isActive('bulletList')}><List className="h-4 w-4" /></ToolbarButton>
                    <ToolbarButton onClick={() => editor?.chain().focus().toggleTaskList().run()} isActive={editor?.isActive('taskList')}><ListTodo className="h-4 w-4" /></ToolbarButton>
                    <ToolbarButton onClick={() => editor?.chain().focus().toggleBlockquote().run()} isActive={editor?.isActive('blockquote')}><Quote className="h-4 w-4" /></ToolbarButton>
                    <div className="w-px h-6 bg-border mx-1" />
                    <ToolbarButton
                        onClick={() => document.getElementById('blog-image-upload')?.click()}
                        disabled={isUploading}
                    >
                        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                        <input
                            id="blog-image-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                        />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={setLink}
                        isActive={editor?.isActive('link')}
                    >
                        <LinkIcon className="h-4 w-4" />
                    </ToolbarButton>
                </div>
            </div>

            <div className="flex-1 py-6 space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                        <input
                            type="text"
                            placeholder="Post Title"
                            className="flex-1 text-4xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/50"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                        <div className="flex items-center space-x-2 shrink-0">
                            <Switch id="published" checked={published} onCheckedChange={setPublished} />
                            <Label htmlFor="published">Publish</Label>
                        </div>
                    </div>
                    {/* Metadata Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label htmlFor="slug" className="text-xs text-muted-foreground">URL Slug</Label>
                            <input
                                id="slug"
                                type="text"
                                placeholder="my-awesome-post"
                                className="w-full text-sm bg-muted/50 border rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="category" className="text-xs text-muted-foreground">Category</Label>
                            <input
                                id="category"
                                type="text"
                                placeholder="Technology, Life, etc."
                                className="w-full text-sm bg-muted/50 border rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            />
                        </div>
                    </div>
                </div>



                <EditorContent editor={editor} />
            </div>

            <div className="border-t py-4 flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                    {wordCount} words
                </div>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Post
                </Button>
            </div>

            {/* SEO Section */}
            <div className="border-t pt-6 mt-2 space-y-4 mb-8">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    Search Engine Optimization
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        {/* Featured Image */}
                        <div className="space-y-2">
                            <Label>Featured Image</Label>
                            <div className="flex flex-col gap-3">
                                {featuredImage && (
                                    <div className="relative w-full aspect-video rounded overflow-hidden border">
                                        <img src={featuredImage} alt="Featured" className="object-cover w-full h-full" />
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-2 right-2 h-8 w-8"
                                            onClick={() => setFeaturedImage('')}
                                        >
                                            <span className="sr-only">Remove</span>
                                            &times;
                                        </Button>
                                    </div>
                                )}
                                <div>
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        disabled={isUploadingFeatured}
                                        onClick={() => document.getElementById('featured-image-upload')?.click()}
                                    >
                                        {isUploadingFeatured ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ImageIcon className="h-4 w-4 mr-2" />}
                                        {featuredImage ? 'Change Image' : 'Upload Featured Image'}
                                    </Button>
                                    <input
                                        id="featured-image-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0]
                                            if (!file) return
                                            setIsUploadingFeatured(true)
                                            const formData = new FormData()
                                            formData.append("file", file)
                                            try {
                                                const response = await fetch("/api/upload", { method: "POST", body: formData })
                                                const data = await response.json()
                                                if (data.url) setFeaturedImage(data.url)
                                            } catch (err) {
                                                console.error(err)
                                                alert("Upload failed")
                                            } finally {
                                                setIsUploadingFeatured(false)
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {/* Keywords */}
                        <div className="space-y-2">
                            <Label htmlFor="keywords">Keywords</Label>
                            <input
                                id="keywords"
                                type="text"
                                placeholder="comma, separated, keywords"
                                className="w-full text-sm bg-muted/50 border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                                value={keywords}
                                onChange={(e) => setKeywords(e.target.value)}
                            />
                        </div>

                        {/* Excerpt */}
                        <div className="space-y-2">
                            <Label htmlFor="excerpt">Excerpt</Label>
                            <textarea
                                id="excerpt"
                                placeholder="Short summary..."
                                className="w-full min-h-[100px] text-sm bg-muted/50 border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                                value={excerpt}
                                onChange={(e) => setExcerpt(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div >
    )
}

const ToolbarButton = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { isActive?: boolean }>(
    ({ className, isActive, ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    "p-2 rounded-md transition-colors hover:bg-muted text-muted-foreground",
                    isActive && "bg-muted text-foreground",
                    className
                )}
                type="button"
                {...props}
            />
        )
    }
)
ToolbarButton.displayName = "ToolbarButton"
