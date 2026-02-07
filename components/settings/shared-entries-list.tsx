"use client"

import { useEffect, useState } from "react"
import { getSharedEntries, updateEntrySharing } from "@/app/lib/actions-share"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Globe, ExternalLink, Trash2, StopCircle } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface SharedEntry {
    id: string
    title: string
    publicSlug: string | null
    publicExpiresAt: Date | null
    date: Date
    journal: {
        title: string
        user?: {
            name: string | null
            email: string
        }
    }
}

interface SharedEntriesListProps {
    isAdmin?: boolean
}

export function SharedEntriesList({ isAdmin }: SharedEntriesListProps) {
    const [entries, setEntries] = useState<SharedEntry[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    const fetchEntries = async () => {
        setLoading(true)
        const data = await getSharedEntries()
        // @ts-ignore
        setEntries(data)
        setLoading(false)
    }

    useEffect(() => {
        fetchEntries()
    }, [])

    const handleUnpublish = async (entryId: string) => {
        const result = await updateEntrySharing(entryId, { isPublic: false })
        if (result.message === "Success") {
            toast.success("Entry unpublished")
            fetchEntries() // Refresh list
            router.refresh() // Refresh server state if needed
        } else {
            toast.error(result.message)
        }
    }

    if (loading) {
        return <div className="text-sm text-muted-foreground">Loading shared entries...</div>
    }

    if (entries.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-muted/10">
                <Globe className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No Public Entries</h3>
                <p className="text-sm text-muted-foreground text-center max-w-sm mt-1">
                    You haven't shared any entries publicly yet. Open an entry and click "Share" to get started.
                </p>
            </div>
        )
    }

    return (
        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Entry Title</TableHead>
                        {isAdmin && <TableHead>Owner</TableHead>}
                        <TableHead>Journal</TableHead>
                        <TableHead>Public Link</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {entries.map((entry) => (
                        <TableRow key={entry.id}>
                            <TableCell className="font-medium">{entry.title}</TableCell>
                            {isAdmin && (
                                <TableCell className="text-muted-foreground">
                                    {entry.journal.user?.name || entry.journal.user?.email || "Unknown"}
                                </TableCell>
                            )}
                            <TableCell className="text-muted-foreground">{entry.journal.title}</TableCell>
                            <TableCell>
                                <a
                                    href={`/public/${entry.publicSlug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center text-primary hover:underline text-sm gap-1"
                                >
                                    /public/{entry.publicSlug}
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                            </TableCell>
                            <TableCell className="text-muted-foreground whitespace-nowrap">
                                {entry.publicExpiresAt ? (
                                    <span className="tabular-nums">
                                        <ClientDate date={entry.publicExpiresAt} />
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground/50">-</span>
                                )}
                            </TableCell>
                            <TableCell className="text-right">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
                                    onClick={() => handleUnpublish(entry.id)}
                                >
                                    <StopCircle className="h-4 w-4" />
                                    Unpublish
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

function ClientDate({ date }: { date: Date | string }) {
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])

    if (!mounted) return null

    const d = new Date(date)
    return <>{d.toLocaleDateString()} {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
}
