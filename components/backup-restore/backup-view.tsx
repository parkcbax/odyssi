"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { Archive, Save, Clock } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { getAppConfig, updateAppFeatures } from "@/app/lib/actions"

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

    // Auto Backup State
    const [enableAutoBackup, setEnableAutoBackup] = useState(false)
    const [autoBackupInterval, setAutoBackupInterval] = useState("1Week")
    const [isSavingSettings, setIsSavingSettings] = useState(false)

    useEffect(() => {
        // Load settings
        getAppConfig().then(config => {
            if (config) {
                setEnableAutoBackup(config.enableAutoBackup)
                setAutoBackupInterval(config.autoBackupInterval)

                // Trigger lazy check if enabled
                if (config.enableAutoBackup) {
                    fetch("/api/cron/backup").catch(e => console.error("Lazy backup check failed", e))
                }
            }
        })
    }, [])

    const handleSaveAutoSettings = async () => {
        setIsSavingSettings(true)
        try {
            const formData = new FormData()
            // We need to fetch current config first to preserve other settings? 
            // Ideally updateAppFeatures handles specific fields, OR we pass current state of other toggles.
            // But updateAppFeatures is built for the Settings page form. 
            // We can reuse it but we need to be careful not to overwrite other redirectHomeToLogin etc if they are missing?
            // "updateAppFeatures" reads formData. 
            // Wait, looking at actions.ts: 
            // const redirectHomeToLogin = formData.get("redirectHomeToLogin") === "on"
            // If I don't pass it, it becomes false! This is risky reusing that action here without all fields.
            // Safe bet: Fetch config first (we have it in state? no, local state only has auto backup).

            const config = await getAppConfig()

            if (config.redirectHomeToLogin) formData.append("redirectHomeToLogin", "on")
            if (config.enableBlogging) formData.append("enableBlogging", "on")

            if (enableAutoBackup) formData.append("enableAutoBackup", "on")
            formData.append("autoBackupInterval", autoBackupInterval)

            await updateAppFeatures(null, formData)
            toast.success("Auto backup settings saved")

        } catch (error) {
            toast.error("Failed to save settings")
        } finally {
            setIsSavingSettings(false)
        }
    }

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
                    splitSize: partSize,
                    source: "MANUAL"
                })
            })

            setProgress(70)

            if (!res.ok) throw new Error("Backup failed")

            const data = await res.json()
            setProgress(100)
            toast.success(data.message)

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
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Automatic Backup
                    </CardTitle>
                    <CardDescription>Configure the system to automatically backup your data periodically.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="auto-backup">Enable Automatic Backup</Label>
                            <p className="text-sm text-muted-foreground">System will check and run backup in the background.</p>
                        </div>
                        <Switch
                            id="auto-backup"
                            checked={enableAutoBackup}
                            onCheckedChange={setEnableAutoBackup}
                        />
                    </div>

                    {enableAutoBackup && (
                        <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-top-2">
                            <Label>Backup Frequency</Label>
                            <Select value={autoBackupInterval} onValueChange={setAutoBackupInterval}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Select Frequency" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1Week">Every 1 Week</SelectItem>
                                    <SelectItem value="1Month">Every 1 Month</SelectItem>
                                    <SelectItem value="6Month">Every 6 Months</SelectItem>
                                    <SelectItem value="1Year">Every 1 Year</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <Button onClick={handleSaveAutoSettings} disabled={isSavingSettings} variant="secondary" size="sm">
                        {isSavingSettings ? "Saving..." : "Save Settings"}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Create Manual Backup</CardTitle>
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
        </div>
    )
}
