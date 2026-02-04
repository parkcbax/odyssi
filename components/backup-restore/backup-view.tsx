"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { Archive, Save } from "lucide-react"

// Since getJournals is a server action, let's just fetch simplified list or pass it as prop.
// For simplicity, let's assume we pass journals as props or fetch them in useEffect.

interface BackupViewProps {
    journals: { id: string, title: string }[]
}

export function BackupView({ journals }: BackupViewProps) {
    const [backupType, setBackupType] = useState<"EVERYTHING" | "JOURNAL">("EVERYTHING")
    const [selectedJournal, setSelectedJournal] = useState<string>("")
    const [splitType, setSplitType] = useState<"SINGLE" | "MULTIPART">("SINGLE")
    const [partSize, setPartSize] = useState<"250MB" | "500MB">("250MB")

    const [isBackingUp, setIsBackingUp] = useState(false)
    const [progress, setProgress] = useState(0)

    const handleBackup = async () => {
        if (backupType === "JOURNAL" && !selectedJournal) {
            toast.error("Please select a journal")
            return
        }

        setIsBackingUp(true)
        setProgress(10) // Started

        try {
            const res = await fetch("/api/backups/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: backupType,
                    journalId: selectedJournal,
                    multipart: splitType === "MULTIPART",
                    splitSize: partSize
                })
            })

            // Simulated progress since fetch doesn't support generic progress easily unless streaming
            // We just jump to 90 then 100 on complete.
            setProgress(70)

            if (!res.ok) throw new Error("Backup failed")

            const data = await res.json()
            setProgress(100)
            toast.success(data.message)

            // Allow progress bar to fill
            setTimeout(() => {
                setIsBackingUp(false)
                setProgress(0)
            }, 1000)

        } catch (error) {
            toast.error("An error occurred during backup")
            setIsBackingUp(false)
            setProgress(0)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Create Backup</CardTitle>
                <CardDescription>Export your journals and memories to a secure zip file.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <Label>What to backup?</Label>
                    <RadioGroup value={backupType} onValueChange={(v) => setBackupType(v as any)}>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="EVERYTHING" id="everything" />
                            <Label htmlFor="everything">Everything (All Journals & Settings)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="JOURNAL" id="journal" />
                            <Label htmlFor="journal">Selected Journal</Label>
                        </div>
                    </RadioGroup>

                    {backupType === "JOURNAL" && (
                        <div className="ml-6">
                            <Select value={selectedJournal} onValueChange={setSelectedJournal}>
                                <SelectTrigger className="w-[300px]">
                                    <SelectValue placeholder="Select a journal" />
                                </SelectTrigger>
                                <SelectContent>
                                    {journals.map(j => (
                                        <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                {backupType === "EVERYTHING" && (
                    <div className="space-y-4 pt-4 border-t">
                        <Label>Archive Format</Label>
                        <RadioGroup value={splitType} onValueChange={(v) => setSplitType(v as any)}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="SINGLE" id="single" />
                                <Label htmlFor="single">Single Archive (Best for most users)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="MULTIPART" id="multipart" />
                                <Label htmlFor="multipart">Multipart Split Archive</Label>
                            </div>
                        </RadioGroup>

                        {splitType === "MULTIPART" && (
                            <div className="ml-6 flex items-center gap-4">
                                <Label className="text-sm text-muted-foreground">Part Size:</Label>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant={partSize === "250MB" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setPartSize("250MB")}
                                    >
                                        250MB
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={partSize === "500MB" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setPartSize("500MB")}
                                    >
                                        500MB
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {isBackingUp && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Processing...</span>
                            <span>{progress}%</span>
                        </div>
                        <Progress value={progress} />
                    </div>
                )}

                <Button onClick={handleBackup} disabled={isBackingUp} className="w-full sm:w-auto">
                    <Save className="mr-2 h-4 w-4" />
                    {isBackingUp ? "Backing up..." : "Start Backup"}
                </Button>
            </CardContent>
        </Card>
    )
}
