"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { CustomImage } from '@/components/tiptap/image-extension'
import LocationPicker from '@/components/location-picker'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import LinkExtension from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import CharacterCount from '@tiptap/extension-character-count'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { CodeBlockComponent } from './tiptap/code-block-component'
import { LocationExtension } from '@/components/tiptap/location-extension'
import { all, createLowlight } from 'lowlight'
const lowlight = createLowlight(all)

const LANGUAGES = [
    { label: 'Plain Text', value: 'plaintext' },
    { label: 'Python', value: 'python' },
    { label: 'JavaScript', value: 'javascript' },
    { label: 'TypeScript', value: 'typescript' },
    { label: 'C', value: 'c' },
    { label: 'C++', value: 'cpp' },
    { label: 'Java', value: 'java' },
    { label: 'Rust', value: 'rust' },
    { label: 'Go', value: 'go' },
    { label: 'Docker', value: 'dockerfile' },
    { label: 'YAML', value: 'yaml' },
    { label: 'Shell/Bash', value: 'bash' },
    { label: 'XML/HTML', value: 'xml' },
    { label: 'JSON', value: 'json' },
]

const MOODS = ["😊", "😢", "😡", "😴", "🤔", "🎉", "🔥", "❤️", "✨", "🌧️"]
import { useState, useEffect, forwardRef } from 'react'
import { Button } from '@/components/ui/button'
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    List,
    ListTodo,
    Heading1,
    Heading2,
    Quote,
    MapPin,
    Calendar as CalendarIcon,
    Smile,
    Hash,
    ChevronLeft,
    Loader2,
    Image as ImageIcon,
    Link as LinkIcon,
    Code,
    SquareCode,
    Braces,
    X,
    Map
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { createEntry, updateEntry } from '@/app/lib/actions'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"

interface Journal {
    id: string
    title: string
    color: string
}

interface EntryData {
    id?: string
    title: string
    content: any
    journalId: string
    date: Date
    mood?: string
    locationName?: string
    locationLat?: number | null
    locationLng?: number | null
    tags?: string[]
}

interface EntryEditorProps {
    journals: Journal[]
    initialData?: EntryData
}

export function EntryEditor({ journals, initialData }: EntryEditorProps) {
    const router = useRouter()

    // State
    const [title, setTitle] = useState(initialData?.title || '')
    const [selectedJournalId, setSelectedJournalId] = useState<string>(initialData?.journalId || journals[0]?.id || '')
    const [date, setDate] = useState<Date>(initialData?.date ? new Date(initialData.date) : new Date())
    const [mood, setMood] = useState<string>(initialData?.mood || '')
    const [locationName, setLocationName] = useState<string>(initialData?.locationName || '')
    const [locationLat, setLocationLat] = useState<number | null>(initialData?.locationLat || null)
    const [locationLng, setLocationLng] = useState<number | null>(initialData?.locationLng || null)
    const [tags, setTags] = useState<string>(initialData?.tags ? initialData.tags.join(', ') : '')

    const [isSaving, setIsSaving] = useState(false)
    const [isUploading, setIsUploading] = useState(false)

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                codeBlock: false,
            }),
            Placeholder.configure({
                placeholder: 'Write your thoughts...',
                emptyEditorClass: 'is-editor-empty before:content-[attr(data-placeholder)] before:text-muted-foreground before:float-left before:pointer-events-none',
            }),
            CustomImage,
            LinkExtension.configure({ openOnClick: false }),
            Underline,
            TaskList,
            TaskItem.configure({ nested: true }),
            CharacterCount,
            CodeBlockLowlight.configure({
                lowlight,
            }).extend({
                addNodeView() {
                    return ReactNodeViewRenderer(CodeBlockComponent)
                },
            }),
            LocationExtension,
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

    if (!mounted || !editor) return null

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
        formData.append('content', JSON.stringify(content))
        formData.append('journalId', selectedJournalId)
        formData.append('date', date.toISOString())
        if (mood) formData.append('mood', mood)
        if (locationName) formData.append('locationName', locationName)
        if (locationLat) formData.append('locationLat', locationLat.toString())
        if (locationLng) formData.append('locationLng', locationLng.toString())
        if (tags) formData.append('tags', tags)

        let result;
        if (initialData?.id) {
            formData.append('id', initialData.id)
            result = await updateEntry(null, formData)
        } else {
            result = await createEntry(null, formData)
        }

        if (result?.message === "Success") {
            if (initialData?.id) {
                router.push(`/entries/${initialData.id}`)
            } else {
                router.push('/dashboard')
            }
            router.refresh()
        } else {
            alert("Failed to save")
            setIsSaving(false)
        }
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0 || !editor) return

        setIsUploading(true)

        const urls: string[] = []

        // Upload sequentially to maintain order
        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            const formData = new FormData()
            formData.append("file", file)

            try {
                const response = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                })

                const data = await response.json()
                if (data.url) {
                    urls.push(data.url)
                } else {
                    console.error("Upload failed for file:", file.name)
                }
            } catch (error) {
                console.error("Upload error:", error)
            }
        }

        if (urls.length > 0) {
            // Insert all images at once
            const content = urls.flatMap(url => [
                { type: 'image', attrs: { src: url } },
                { type: 'paragraph' }
            ])
            editor.chain().focus().insertContent(content).run()
        }

        setIsUploading(false)
        // Reset input
        e.target.value = ""
    }

    const setLink = () => {
        if (!editor) return
        const previousUrl = editor.getAttributes("link").href
        const url = window.prompt("URL", previousUrl)

        // cancelled
        if (url === null) return

        // empty
        if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run()
            return
        }

        // update link
        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
    }

    return (
        <div className="flex flex-col h-[calc(100vh-2rem)]">
            {/* Header */}
            <div className="flex items-center justify-between py-4 border-b bg-background/95 backdrop-blur z-10 sticky top-0">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="icon">
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div className="flex items-center gap-2">
                        <BookIcon className="h-4 w-4 text-muted-foreground" />
                        <Select value={selectedJournalId} onValueChange={setSelectedJournalId}>
                            <SelectTrigger className="w-[120px] sm:w-[180px] border-none shadow-none font-medium text-muted-foreground hover:text-foreground">
                                <SelectValue placeholder="Select Journal" />
                            </SelectTrigger>
                            <SelectContent>
                                {journals.map((journal) => (
                                    <SelectItem key={journal.id} value={journal.id}>
                                        <div className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: journal.color }} />
                                            {journal.title}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Date Display/Picker in Header? Or just toolbar?  */}
                    <div className="text-sm text-muted-foreground hidden md:block">
                        {date.toLocaleDateString()}
                    </div>
                    <Button onClick={handleSave} disabled={isSaving} className="min-w-[80px]">
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto py-8">
                <div className="max-w-3xl mx-auto space-y-8 px-4">
                    {/* Meta Info Display (if set) */}
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        {mood && <span className="bg-muted px-2 py-1 rounded-md">Mood: {mood}</span>}
                        {tags && tags.split(',').filter(Boolean).map((t, i) => (
                            <span key={i} className="bg-muted px-2 py-1 rounded-md">#{t.trim()}</span>
                        ))}
                        {locationName && <span className="bg-muted px-2 py-1 rounded-md flex items-center gap-1"><MapPin className="h-3 w-3" /> {locationName}</span>}
                    </div>

                    <input
                        type="text"
                        placeholder="Add a title..."
                        className="w-full text-4xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/50"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        autoFocus
                    />

                    <EditorContent editor={editor} />
                </div>
            </div>

            {/* Bottom Toolbar */}
            <div className="border-t bg-background/95 backdrop-blur sticky bottom-0 z-10">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 p-1 sm:p-2">
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth">
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
                        <ToolbarButton onClick={() => editor?.chain().focus().toggleCodeBlock().run()} isActive={editor?.isActive('codeBlock')} title="Code Block"><Braces className="h-4 w-4" /></ToolbarButton>
                        <div className="w-px h-6 bg-border mx-1" />

                        {/* Media & Link Tools */}
                        <ToolbarButton
                            onClick={() => document.getElementById('image-upload')?.click()}
                            disabled={isUploading}
                        >
                            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                            <input
                                id="image-upload"
                                type="file"
                                accept="image/*"
                                multiple
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

                        <Popover>
                            <PopoverTrigger asChild>
                                <ToolbarButton title="Insert Map Block">
                                    <Map className="h-4 w-4" />
                                </ToolbarButton>
                            </PopoverTrigger>
                            <PopoverContent className="w-96 p-4" align="start">
                                <div className="space-y-4">
                                    <h4 className="font-medium leading-none">Insert Location Block</h4>
                                    <div className="h-[300px] w-full border rounded-md overflow-hidden relative">
                                        <LocationPicker
                                            lat={null}
                                            lng={null}
                                            onLocationSelect={(lat, lng) => {
                                                // Ask for label or default
                                                const label = prompt("Location Name (optional):", `${lat.toFixed(4)}, ${lng.toFixed(4)}`)
                                                editor?.chain().focus().insertContent({
                                                    type: 'locationMap',
                                                    attrs: { lat, lng, label: label || `${lat.toFixed(4)}, ${lng.toFixed(4)}` }
                                                }).run()
                                                // Close popover logic would be ideal but for now this works as it inserts and user clicks away
                                            }}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">Click on the map to insert this location into your entry.</p>
                                </div>
                            </PopoverContent>
                        </Popover>

                        <div className="w-px h-6 bg-border mx-1" />

                        {/* Metadata Tools */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <ToolbarButton onClick={() => { }} isActive={!!date}>
                                    <CalendarIcon className="h-4 w-4" />
                                </ToolbarButton>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={(d) => d && setDate(d)}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>

                        <Popover>
                            <PopoverTrigger asChild>
                                <ToolbarButton onClick={() => { }} isActive={!!tags}>
                                    <Hash className="h-4 w-4" />
                                </ToolbarButton>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-4" align="start">
                                <div className="space-y-2">
                                    <h4 className="font-medium leading-none">Tags</h4>
                                    <p className="text-sm text-muted-foreground">Comma separated tags</p>
                                    <Input
                                        value={tags}
                                        onChange={(e) => setTags(e.target.value)}
                                        placeholder="ideas, work, personal..."
                                    />
                                </div>
                            </PopoverContent>
                        </Popover>

                        <Popover>
                            <PopoverTrigger asChild>
                                <ToolbarButton onClick={() => { }} isActive={!!mood}>
                                    <Smile className="h-4 w-4" />
                                </ToolbarButton>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-2" align="start">
                                <div className="grid grid-cols-5 gap-2">
                                    {MOODS.map(m => (
                                        <button
                                            key={m}
                                            className={cn("text-2xl hover:bg-muted rounded p-1", mood === m && "bg-muted")}
                                            onClick={() => setMood(m)}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full mt-2 text-xs text-muted-foreground"
                                    onClick={() => setMood("")}
                                >
                                    Clear Mood
                                </Button>
                            </PopoverContent>
                        </Popover>

                        <Popover>
                            <PopoverTrigger asChild>
                                <ToolbarButton onClick={() => { }} isActive={!!locationName}>
                                    <MapPin className="h-4 w-4" />
                                </ToolbarButton>
                            </PopoverTrigger>
                            <PopoverContent className="w-96 p-4" align="start">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-medium leading-none">Location</h4>
                                    </div>

                                    <Tabs defaultValue="text" className="w-full">
                                        <TabsList className="grid w-full grid-cols-2">
                                            <TabsTrigger value="text">Manual Text</TabsTrigger>
                                            <TabsTrigger value="map">Map / GPS</TabsTrigger>
                                        </TabsList>

                                        <TabsContent value="text" className="space-y-2 mt-4">
                                            <div className="space-y-1">
                                                <label className="text-xs text-muted-foreground">Location Name</label>
                                                <Input
                                                    value={locationName}
                                                    onChange={(e) => setLocationName(e.target.value)}
                                                    placeholder="e.g. Starbucks, Home, Paris..."
                                                />
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="map" className="mt-4">
                                            <div className="space-y-4">
                                                <div className="h-[300px] w-full border rounded-md overflow-hidden relative">
                                                    <LocationPicker
                                                        lat={locationLat}
                                                        lng={locationLng}
                                                        onLocationSelect={(lat, lng) => {
                                                            setLocationLat(lat)
                                                            setLocationLng(lng)
                                                            // Optional: reverse geocode later if needed
                                                            if (!locationName) {
                                                                setLocationName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
                                                            }
                                                        }}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs text-muted-foreground">Location Name (Optional)</label>
                                                    <Input
                                                        value={locationName}
                                                        onChange={(e) => setLocationName(e.target.value)}
                                                        placeholder="Name for this spot..."
                                                    />
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    Saved: {locationLat ? `${locationLat.toFixed(4)}, ${locationLng?.toFixed(4)}` : "No coordinates set"}
                                                </div>
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                </div>
                            </PopoverContent>
                        </Popover>

                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                        {wordCount} words
                    </div>
                </div>
            </div>
        </div>
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

function BookIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
    )
}
