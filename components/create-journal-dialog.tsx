"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"
import { createJournal } from "@/app/lib/actions"
// Using useActionState for Next.js 16 / React 19
import { useActionState, useState, useEffect } from "react"
import { useFormStatus } from "react-dom"

// I need to install a few more things if I want a date picker or something special, but for color/icon I can use simple UI for now.
import { cn } from "@/lib/utils"
// import emoji data if needed, or just a simple list for now to keep it minimal as per "minimalist" goal. 
// Or better: Use native emoji picker or a simple list of select emojis.
// For now, I'll use a curated list of emojis to match the screenshot vibe.

const COLORS = [
    "#4F46E5", // Indigo (Default)
    "#0EA5E9", // Sky
    "#22C55E", // Green
    "#EAB308", // Yellow
    "#EF4444", // Red
    "#8B5CF6", // Violet
    "#F97316", // Orange
    "#64748B", // Slate
    "#6366F1", // Indigo-ish
    "#71717A", // Zinc
]

const ICONS = [
    "📔", "📕", "📗", "📘", "📙", "📓", "✏️", "✍️", "🖊️", "🖋️", "📝", "💭",
    "💡", "🌟", "✨", "🎯", "🎨", "🎭", "🎪", "🎬", "📸", "🌈", "🌺", "🌻", "🌸",
    "🌷", "🔥", "⚡", "💫", "🌙", "☀️"
]

export function CreateJournalDialog() {
    const [open, setOpen] = useState(false)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [state, dispatch] = useActionState(createJournal, {} as any)
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [selectedColor, setSelectedColor] = useState(COLORS[0])
    const [selectedIcon, setSelectedIcon] = useState("")

    useEffect(() => {
        if (state?.message === "Success") {
            setOpen(false)
            // Reset form
            setTitle("")
            setDescription("")
            setSelectedColor(COLORS[0])
            setSelectedIcon("")
        }
    }, [state])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Journal
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2" onClick={() => setOpen(false)}>
                            <span className="sr-only">Close</span>
                            <span aria-hidden="true" className="text-lg">←</span>
                        </Button>
                        <DialogTitle>Create Journal</DialogTitle>
                    </div>
                </DialogHeader>
                <form action={dispatch}>
                    <input type="hidden" name="color" value={selectedColor} />
                    <input type="hidden" name="icon" value={selectedIcon} />

                    <div className="grid gap-6 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                name="title"
                                placeholder="Title"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                            />
                            <div className="flex justify-end text-xs text-muted-foreground">
                                {title.length}/100
                            </div>
                            {state?.errors?.title && (
                                <p className="text-sm text-red-500">{state.errors.title}</p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="Description (Optional)"
                                className="h-24 resize-none"
                                value={description}
                                onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                            />
                            <div className="flex justify-end text-xs text-muted-foreground">
                                {description.length}/500
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label>Color</Label>
                            <div className="flex flex-wrap gap-2">
                                {COLORS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        className={cn(
                                            "h-8 w-8 rounded-full transition-all border-2",
                                            selectedColor === color ? "border-primary scale-110" : "border-transparent hover:scale-110"
                                        )}
                                        style={{ backgroundColor: color }}
                                        onClick={() => setSelectedColor(color)}
                                    >
                                        {selectedColor === color && (
                                            <span className="flex items-center justify-center text-white">
                                                ✓
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label>Icon (Optional)</Label>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    className={cn(
                                        "flex h-9 w-9 items-center justify-center rounded-md border text-sm transition-all",
                                        selectedIcon === "" ? "border-primary bg-accent" : "border-input hover:bg-accent"
                                    )}
                                    onClick={() => setSelectedIcon("")}
                                >
                                    ✕
                                </button>
                                {ICONS.map((icon) => (
                                    <button
                                        key={icon}
                                        type="button"
                                        className={cn(
                                            "flex h-9 w-9 items-center justify-center rounded-md border text-lg transition-all",
                                            selectedIcon === icon ? "border-primary bg-accent" : "border-input hover:bg-accent"
                                        )}
                                        onClick={() => setSelectedIcon(icon)}
                                    >
                                        {icon}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        {state?.message && state.message !== "Success" && (
                            <p className="mr-auto text-sm text-red-500 self-center">{state.message}</p>
                        )}
                        <Button type="submit" disabled={!title} className="w-full">
                            Create Journal
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function SaveButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Creating..." : "Create Journal"}
        </Button>
    )
}
