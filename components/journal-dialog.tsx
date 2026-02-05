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
import { Plus, Edit2, Settings } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { createJournal, updateJournal } from "@/app/lib/actions"
import { useActionState, useState, useEffect } from "react"
import { useFormStatus } from "react-dom"
import { cn } from "@/lib/utils"

const COLORS = [
    "#718982", // Sage Green (Default)
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

interface JournalDialogProps {
    mode?: "create" | "edit"
    journal?: {
        id: string
        title: string
        description: string | null
        color: string
        icon: string | null
        isDefault?: boolean
    }
    trigger?: React.ReactNode
}

export function JournalDialog({ mode = "create", journal, trigger }: JournalDialogProps) {
    const [open, setOpen] = useState(false)
    const action = mode === "create" ? createJournal : updateJournal
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [state, dispatch] = useActionState(action, {} as any)

    const [title, setTitle] = useState(journal?.title || "")
    const [description, setDescription] = useState(journal?.description || "")
    const [selectedColor, setSelectedColor] = useState(journal?.color || COLORS[0])
    const [selectedIcon, setSelectedIcon] = useState(journal?.icon || "")
    const [isDefault, setIsDefault] = useState(journal?.isDefault || false)

    useEffect(() => {
        if (state?.message === "Success") {
            setOpen(false)
            if (mode === "create") {
                // Reset form only on create
                setTitle("")
                setDescription("")
                setSelectedColor(COLORS[0])
                setSelectedIcon("")
                setIsDefault(false)
            }
        }
    }, [state, mode])

    const isEdit = mode === "edit"

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button size="sm" className="gap-2">
                        {isEdit ? <Settings className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        {isEdit ? "Edit Journal" : "New Journal"}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <DialogTitle>{isEdit ? "Edit Journal" : "Create Journal"}</DialogTitle>
                    </div>
                </DialogHeader>
                <form action={dispatch}>
                    {isEdit && <input type="hidden" name="id" value={journal?.id} />}
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

                        <div className="flex items-center space-x-2 border rounded-lg p-3 bg-muted/20">
                            <Switch
                                id="is-default"
                                checked={isDefault}
                                onCheckedChange={setIsDefault}
                            />
                            <Label htmlFor="is-default" className="flex flex-col cursor-pointer">
                                <span>Set as Default Journal</span>
                                <span className="font-normal text-xs text-muted-foreground">This journal will be selected automatically when creating new entries.</span>
                            </Label>
                            <input type="hidden" name="isDefault" value={isDefault ? "on" : "off"} />
                        </div>
                    </div>
                    <DialogFooter>
                        {state?.message && state.message !== "Success" && (
                            <p className="mr-auto text-sm text-red-500 self-center">{state.message}</p>
                        )}
                        <SubmitButton isEdit={isEdit} disabled={!title} />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function SubmitButton({ isEdit, disabled }: { isEdit: boolean, disabled: boolean }) {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" disabled={pending || disabled} className="w-full">
            {pending ? (isEdit ? "Saving..." : "Creating...") : (isEdit ? "Save Changes" : "Create Journal")}
        </Button>
    )
}
