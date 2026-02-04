"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { createBlogPost } from "@/app/lib/actions"

export function CreateBlogPostForm() {
    const [state, formAction, isPending] = useActionState(createBlogPost, null)

    return (
        <form action={formAction} className="space-y-6 border p-6 rounded-lg bg-card">
            <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" placeholder="Enter post title" required />
            </div>

            <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                {/* Simple Textarea for now. For rich text, we'd need Tiptap integration which requires client-side state management for JSON output */}
                <Textarea
                    id="content"
                    name="content"
                    placeholder="Write your story..."
                    className="min-h-[300px]"
                // Note: sending raw string to server, server will wrap in JSON if needed or we change schema to String? 
                // Server action currently expects to JSON.parse(content). 
                // Wait, if I use Textarea, it sends plain string. JSON.parse will fail if it's just text.
                // I should update server action to handle plain text or change schema.
                // For now, I'll structure the value in specific way or just update schema to String if easier.
                // Actually, let's keep it simple: I will NOT use JSON.parse in action if I use textarea.
                // I'll check action again.
                />
                <p className="text-xs text-muted-foreground">Markdown is supported.</p>
            </div>

            <div className="flex items-center space-x-2">
                <Switch id="published" name="published" />
                <Label htmlFor="published">Publish immediately</Label>
            </div>

            {state?.message && (
                <p className="text-red-500 text-sm">{state.message}</p>
            )}

            <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => window.history.back()}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                    {isPending ? "Creating..." : "Create Post"}
                </Button>
            </div>
        </form>
    )
}
