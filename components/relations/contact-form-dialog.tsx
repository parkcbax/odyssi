"use client"

import { useState } from "react"
import { Group, Contact } from "@prisma/client"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { upsertContact } from "@/app/lib/relations-actions"
import { toast } from "sonner"
import { Loader2, Camera, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ContactFormDialogProps {
    userId: string
    groups: Group[]
    contact?: Contact
    children?: React.ReactNode
}

export function ContactFormDialog({ userId, groups, contact, children }: ContactFormDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [profilePicture, setProfilePicture] = useState(contact?.profilePicture || "")
    const [uploading, setUploading] = useState(false)

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })

            if (response.ok) {
                const data = await response.json()
                setProfilePicture(data.url)
                toast.success("Image uploaded")
            }
        } catch (error) {
            toast.error("Upload failed")
        } finally {
            setUploading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        if (contact) formData.append("id", contact.id)

        const result = await upsertContact(formData)
        setLoading(false)

        if (result.message === "Success") {
            toast.success(contact ? "Contact updated" : "Contact created")
            setOpen(false)
        } else {
            toast.error(result.message || "Failed to save contact")
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
                        <DialogTitle>{contact ? "Edit Contact" : "Add New Contact"}</DialogTitle>
                        <DialogDescription>
                            Enter the details of your contact here. Click save when you're done.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Profile Picture</Label>
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={profilePicture || undefined} />
                                    <AvatarFallback><User className="h-8 w-8" /></AvatarFallback>
                                </Avatar>
                                <div className="flex-1 flex flex-col gap-2">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                        id="contact-image-upload"
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => document.getElementById('contact-image-upload')?.click()}
                                            disabled={uploading}
                                        >
                                            {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Camera className="h-4 w-4 mr-2" />}
                                            {profilePicture ? "Change Photo" : "Upload Photo"}
                                        </Button>
                                        {profilePicture && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setProfilePicture("")}
                                            >
                                                Remove
                                            </Button>
                                        )}
                                    </div>
                                    <input type="hidden" name="profilePicture" value={profilePicture} />
                                </div>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input id="fullName" name="fullName" defaultValue={contact?.fullName} required placeholder="John Doe" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" defaultValue={contact?.email || ""} placeholder="john@example.com" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phoneNumber">Phone Number</Label>
                            <Input id="phoneNumber" name="phoneNumber" defaultValue={contact?.phoneNumber || ""} placeholder="+1 (555) 000-0000" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="groupId">Group</Label>
                            <Select name="groupId" defaultValue={contact?.groupId || "none"}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a group" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No Group</SelectItem>
                                    {groups.map((group) => (
                                        <SelectItem key={group.id} value={group.id}>
                                            {group.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea id="notes" name="notes" defaultValue={contact?.notes || ""} placeholder="Add any extra details here..." />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {contact ? "Update Contact" : "Create Contact"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
