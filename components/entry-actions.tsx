"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2, Edit2 } from "lucide-react"
import { deleteEntry } from "@/app/lib/actions"
import { useRouter } from "next/navigation"
import Link from "next/link"
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
}

export function EntryActions({ entryId, journalId, title }: EntryActionsProps) {
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

    return (
        <div className="flex items-center gap-2">
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
