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
        // Store original title
        const originalTitle = document.title
        // Set title to empty string to hide it from the browser's print header
        document.title = " "

        // Trigger print
        window.print()

        // Restore original title (after a small delay to ensure print dialog picks it up)
        setTimeout(() => {
            document.title = originalTitle
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
                <FileDown className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Save PDF</span>
            </Button>
            <Button asChild variant="outline" size="sm">
                <Link href={`/entries/${entryId}/edit`}>
                    <Edit2 className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Edit</span>
                </Link>
            </Button>

            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Delete</span>
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
