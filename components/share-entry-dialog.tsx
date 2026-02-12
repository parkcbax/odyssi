"use client"

import { QRCodeSVG } from 'qrcode.react'
import { useState } from "react"
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
import { Switch } from "@/components/ui/switch"
import { Globe, Link as LinkIcon, Copy, Check, Lock, X, CalendarClock } from "lucide-react"
import { updateEntrySharing } from "@/app/lib/actions-share"
import { toast } from "sonner"

interface ShareEntryDialogProps {
    entryId: string
    initialIsPublic: boolean
    initialPublicSlug: string | null
    initialPublicPassword?: string | null
    initialPublicExpiresAt?: Date | null
}

export function ShareEntryDialog({
    entryId,
    initialIsPublic,
    initialPublicSlug,
    initialPublicPassword,
    initialPublicExpiresAt
}: ShareEntryDialogProps) {
    const generateRandomSlug = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        let result = ''
        for (let i = 0; i < 5; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return result
    }

    const toLocalISOString = (date: Date) => {
        const offset = date.getTimezoneOffset()
        const localDate = new Date(date.getTime() - (offset * 60 * 1000))
        return localDate.toISOString().slice(0, 16)
    }

    const [open, setOpen] = useState(false)
    const [isPublic, setIsPublic] = useState(initialIsPublic)
    const [slug, setSlug] = useState(initialPublicSlug || generateRandomSlug())
    const [password, setPassword] = useState(initialPublicPassword || "")
    const [enablePassword, setEnablePassword] = useState(!!initialPublicPassword)
    const [expiresAt, setExpiresAt] = useState(initialPublicExpiresAt ? toLocalISOString(new Date(initialPublicExpiresAt)) : "")
    const [enableExpiration, setEnableExpiration] = useState(!!initialPublicExpiresAt)
    const [loading, setLoading] = useState(false)
    const [copied, setCopied] = useState(false)

    const publicUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/public/${slug}`
        : `/public/${slug}`

    const handleSave = async () => {
        setLoading(true)
        const result = await updateEntrySharing(entryId, {
            isPublic,
            publicSlug: slug || undefined,
            publicPassword: enablePassword ? password : undefined,
            publicExpiresAt: enableExpiration && expiresAt ? new Date(expiresAt).toISOString() : undefined
        })

        if (result.message === "Success") {
            setOpen(false)
            toast.success("Sharing settings updated")
        } else {
            toast.error(result.message)
        }
        setLoading(false)
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(publicUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Globe className="h-4 w-4 mr-2" />
                    Share
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Public Sharing</DialogTitle>
                    <DialogDescription>
                        Make this entry accessible to anyone with the link.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Public Toggle */}
                    <div className="flex items-center justify-between space-x-2">
                        <div className="flex flex-col gap-1">
                            <Label htmlFor="public-mode" className="text-base">Public Access</Label>
                            <span className="text-sm text-muted-foreground">
                                {isPublic ? "Entry is visible to anyone with the link" : "Entry is private"}
                            </span>
                        </div>
                        <Switch
                            id="public-mode"
                            checked={isPublic}
                            onCheckedChange={setIsPublic}
                        />
                    </div>

                    {isPublic && (
                        <>
                            {/* Link Display & Slug Edit */}
                            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                                <Label>Public Link</Label>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-background border rounded-md px-3 py-2 text-sm text-muted-foreground truncate font-mono">
                                        {typeof window !== 'undefined' ? window.location.origin : ''}/public/
                                        <input
                                            type="text"
                                            value={slug}
                                            onChange={(e) => setSlug(e.target.value)}
                                            placeholder="unique-slug"
                                            className="bg-transparent text-foreground placeholder:text-muted-foreground/50 border-none outline-none p-0 w-auto min-w-[50px]"
                                        />
                                    </div>
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        onClick={copyToClipboard}
                                        disabled={!slug}
                                    >
                                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>

                                {/* QR Code */}
                                <div className="flex justify-center pt-2">
                                    <div className="bg-white p-2 rounded-lg">
                                        <QRCodeSVG value={publicUrl} size={128} />
                                    </div>
                                </div>
                            </div>

                            {/* Password Protection */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password-mode" className="flex items-center gap-2">
                                        <Lock className="h-4 w-4" />
                                        Password Protection
                                    </Label>
                                    <Switch
                                        id="password-mode"
                                        checked={enablePassword}
                                        onCheckedChange={setEnablePassword}
                                    />
                                </div>

                                {enablePassword && (
                                    <div className="pl-6 border-l-2 ml-1">
                                        <Input
                                            type="text"
                                            placeholder="Set a password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground mt-2">
                                            Visitors will need this password to view the entry.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Expiration */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="expiration-mode" className="flex items-center gap-2">
                                        <CalendarClock className="h-4 w-4" />
                                        Expiration
                                    </Label>
                                    <Switch
                                        id="expiration-mode"
                                        checked={enableExpiration}
                                        onCheckedChange={setEnableExpiration}
                                    />
                                </div>

                                {enableExpiration && (
                                    <div className="pl-6 border-l-2 ml-1">
                                        <Input
                                            type="datetime-local"
                                            value={expiresAt}
                                            onChange={(e) => setExpiresAt(e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground mt-2">
                                            The public link will automatically expire at this time.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
