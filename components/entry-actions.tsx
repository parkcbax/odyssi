"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2, Edit2, FileDown } from "lucide-react"
import { deleteEntry } from "@/app/lib/actions"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ShareEntryDialog } from "@/components/share-entry-dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface EntryActionsProps {
    entryId: string
    journalId: string
    title: string
    isPublic: boolean
    publicSlug: string | null
    publicPassword?: string | null
    publicExpiresAt?: Date | null
}

export function EntryActions({
    entryId,
    journalId,
    title,
    isPublic,
    publicSlug,
    publicPassword,
    publicExpiresAt
}: EntryActionsProps) {
    const [isDeleting, setIsDeleting] = useState(false)
    const router = useRouter()

    const handleDelete = async () => {
        setIsDeleting(true)
        const result = await deleteEntry(entryId)
        if (result.message === "Success") {
            router.push(`/journals/${journalId}`)
            router.refresh()
        } else {
            alert(result.message || "Failed to delete")
            setIsDeleting(false)
        }
    }

    const handleSavePDF = () => {
        // We defer to the browser's native print dialog which produces better PDFs (vectors)
        // and doesn't crash on large content.
        // The CSS @media print rule in globals.css handles hiding the UI.

        const element = document.getElementById('entry-printable-content')
        if (!element) return

        // Create a dedicated print wrapper to isolate content
        // This wrapper is styled in globals.css to be the only visible element during print
        const clone = element.cloneNode(true) as HTMLElement
        const wrapper = document.createElement('div')
        wrapper.id = 'entry-printable-content-wrapper'
        wrapper.appendChild(clone)
        document.body.appendChild(wrapper)

        // Trigger print
        window.print()

        // Clean up after a short delay to allow print rendering to initialize
        // (Note: window.print() is blocking in many browsers, but not all)
        setTimeout(() => {
            document.body.removeChild(wrapper)
        }, 500)
    }

    return (
        <div className="flex items-center gap-2">
            <ShareEntryDialog
                entryId={entryId}
                initialIsPublic={isPublic}
                initialPublicSlug={publicSlug}
                initialPublicPassword={publicPassword}
                initialPublicExpiresAt={publicExpiresAt}
            />

            <Button variant="outline" size="sm" onClick={handleSavePDF}>
                <FileDown className="h-4 w-4 mr-2" />
                Save PDF
            </Button>
            <Button asChild variant="outline" size="sm">
                <Link href={`/entries/${entryId}/edit`}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                </Link>
            </Button>

            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Entry?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{title}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Deleting..." : "Delete Entry"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
