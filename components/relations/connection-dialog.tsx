"use client"

import { useState, useEffect } from "react"
import { Contact } from "@prisma/client"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { createConnection } from "@/app/lib/relations-actions"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface ConnectionDialogProps {
    sourceContactId: string
    allContacts: Contact[]
    children: React.ReactNode
}

const CONNECTION_TYPES = [
    "Introduced by",
    "Colleague",
    "Friend",
    "Family",
    "Partner",
    "Client",
    "Mentor",
    "Mentee",
    "Other"
]

export function ConnectionDialog({ sourceContactId, allContacts, children }: ConnectionDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [customType, setCustomType] = useState("")
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        formData.append("sourceContactId", sourceContactId)
        
        const type = formData.get("connectionType")
        if (type === "Other" && customType) {
            formData.set("connectionType", customType)
        }

        const result = await createConnection(formData)
        setLoading(false)

        if (result.message === "Success") {
            toast.success("Connection created")
            setOpen(false)
        } else {
            toast.error(result.message || "Failed to create connection")
        }
    }

    if (!mounted) return <>{children}</>

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Add Connection</DialogTitle>
                        <DialogDescription>
                            Define how this contact is related to someone else.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="targetContactId">Connect To</Label>
                            <Select name="targetContactId" required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select contact" />
                                </SelectTrigger>
                                <SelectContent>
                                    {allContacts.map((contact) => (
                                        <SelectItem key={contact.id} value={contact.id}>
                                            {contact.fullName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="connectionType">Relationship Type</Label>
                            <Select name="connectionType" defaultValue="Colleague" onValueChange={(val) => val !== "Other" && setCustomType("")}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CONNECTION_TYPES.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="customType">Custom Type (Optional)</Label>
                            <Input 
                                id="customType" 
                                placeholder="e.g. Spouse, Cousin..." 
                                value={customType} 
                                onChange={(e) => setCustomType(e.currentTarget.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Connection
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
