"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { RefreshCw, HardDrive, AlertTriangle } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
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

interface BackupFile {
    name: string
    size: number
    createdAt: string
}

export function RestoreView() {
    const [backups, setBackups] = useState<BackupFile[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isRestoring, setIsRestoring] = useState(false)
    const [progress, setProgress] = useState(0)

    const fetchBackups = async () => {
        setIsLoading(true)
        try {
            const res = await fetch("/api/backups")
            const data = await res.json()
            setBackups(data.backups || [])
        } catch (e) {
            toast.error("Failed to load backups")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchBackups()
    }, [])

    const handleRestore = async (filename: string, isEverything: boolean) => {
        setIsRestoring(true)
        setProgress(10)

        try {
            const res = await fetch("/api/backups/restore", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ filename })
            })

            setProgress(60)

            if (!res.ok) throw new Error("Restore failed")

            setProgress(100)
            toast.success("Restore completed successfully")

            // Refresh page if EVERYTHING was restored to reflect changes
            if (isEverything) {
                setTimeout(() => window.location.reload(), 1500)
            } else {
                setIsRestoring(false)
                setProgress(0)
            }

        } catch (error) {
            toast.error("Restore failed. Check server logs.")
            setIsRestoring(false)
            setProgress(0)
        }
    }

    // Helper to identify backup type from filename
    const getBackupType = (name: string) => {
        if (name.includes("-EVERYTHING-")) return "EVERYTHING"
        if (name.includes("-JOURNAL-")) return "JOURNAL"
        return "UNKNOWN"
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Restore Backup</CardTitle>
                    <CardDescription>Restore data from an existing backup file.</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={fetchBackups} title="Refresh List">
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
            </CardHeader>
            <CardContent>
                {isRestoring && (
                    <div className="mb-6 space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Restoring...</span>
                            <span>{progress}%</span>
                        </div>
                        <Progress value={progress} />
                    </div>
                )}

                <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                    {backups.length === 0 ? (
                        <div className="text-center text-muted-foreground py-10">
                            No backup files found in /backups
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {backups.map((backup) => {
                                const type = getBackupType(backup.name)
                                const isEverything = type === "EVERYTHING"

                                return (
                                    <div key={backup.name} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg bg-card/50 hover:bg-muted/30 transition-colors gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="bg-primary/10 p-2 rounded-full mt-1">
                                                <HardDrive className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium truncate max-w-[200px] sm:max-w-md" title={backup.name}>
                                                    {backup.name}
                                                </h4>
                                                <div className="flex gap-2 text-xs text-muted-foreground mt-1 flex-wrap items-center">
                                                    {backup.name.startsWith("auto-backup") ? (
                                                        <span className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                                                            AUTO
                                                        </span>
                                                    ) : (
                                                        <span className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                                                            MANUAL
                                                        </span>
                                                    )}
                                                    <span>•</span>
                                                    <span className="font-mono">{(backup.size / 1024 / 1024).toFixed(2)} MB</span>
                                                    <span>•</span>
                                                    <span>{new Date(backup.createdAt).toLocaleDateString()} {new Date(backup.createdAt).toLocaleTimeString()}</span>
                                                    <span>•</span>
                                                    <span className={`font-semibold ${isEverything ? "text-amber-500" : "text-blue-500"}`}>
                                                        {type}
                                                    </span>
                                                    {type === "JOURNAL" && (
                                                        <span className="font-semibold text-primary">
                                                            - {backup.name.includes("-JOURNAL-") ? backup.name.split("-JOURNAL-")[1]?.split("-202")[0]?.replace(/_/g, " ") : "Unknown"}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant={isEverything ? "destructive" : "default"} size="sm" disabled={isRestoring}>
                                                    Restore
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Restore {type} Backup?</AlertDialogTitle>
                                                    <AlertDialogDescription className="space-y-2">
                                                        <p>Are you sure you want to restore <strong>{backup.name}</strong>?</p>
                                                        {isEverything && (
                                                            <div className="flex items-start gap-2 bg-destructive/10 p-3 rounded-md text-destructive mt-2">
                                                                <AlertTriangle className="h-5 w-5 shrink-0" />
                                                                <span className="text-sm font-semibold">
                                                                    WARNING: Restoring "EVERYTHING" will completely wipe and replace all current data. This action cannot be undone.
                                                                </span>
                                                            </div>
                                                        )}
                                                        {type === "JOURNAL" && (
                                                            <p className="text-sm text-muted-foreground">
                                                                Note: If a journal with the same name exists, it will be restored as a copy (e.g., "My Journal - 2").
                                                            </p>
                                                        )}
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => handleRestore(backup.name, isEverything)}
                                                        className={isEverything ? "bg-destructive hover:bg-destructive/90" : ""}
                                                    >
                                                        Confirm Restore
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
