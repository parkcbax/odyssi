"use client"

import { useState } from "react"
import { Group } from "@prisma/client"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { upsertGroup } from "@/app/lib/relations-actions"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface GroupFormDialogProps {
    userId: string
    group?: Group
    children?: React.ReactNode
}

export function GroupFormDialog({ userId, group, children }: GroupFormDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        if (group) formData.append("id", group.id)

        const result = await upsertGroup(formData)
        setLoading(false)

        if (result.message === "Success") {
            toast.success(group ? "Group updated" : "Group created")
            setOpen(false)
        } else {
            toast.error(result.message || "Failed to save group")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{group ? "Edit Group" : "Add New Group"}</DialogTitle>
                        <DialogDescription>
                            Groups help you organize your contacts.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Group Name</Label>
                            <Input id="name" name="name" defaultValue={group?.name} required placeholder="Work, Family, Friends..." />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" name="description" defaultValue={group?.description || ""} placeholder="Description for this group..." />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {group ? "Update Group" : "Create Group"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
