"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { Archive, Save, Clock, Trash2, Loader2, ChevronDown, ChevronRight, ExternalLink } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { getAppConfig, updateAppFeatures } from "@/app/lib/actions"
import { cleanUnreferencedMedia } from "@/app/lib/actions-media"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface BackupViewProps {
    journals: { id: string, title: string }[]
    initialAutoBackup: boolean
    initialInterval: string
    lastAutoBackupAt?: Date | string | null
}

export function BackupView({ journals, initialAutoBackup, initialInterval, lastAutoBackupAt }: BackupViewProps) {
    const [backupType, setBackupType] = useState<"EVERYTHING" | "JOURNAL">("EVERYTHING")
    const [selectedJournal, setSelectedJournal] = useState<string>("")
    const [splitType, setSplitType] = useState<"SINGLE" | "MULTIPART">("SINGLE")
    const [partSize, setPartSize] = useState<"250MB" | "500MB">("250MB")
    const router = useRouter()

    const [isBackingUp, setIsBackingUp] = useState(false)
    const [progress, setProgress] = useState(0)

    // Media Cleanup State
    const [isCleaning, setIsCleaning] = useState(false)
    const [cleanProgress, setCleanProgress] = useState(0)
    const [cleanStatus, setCleanStatus] = useState("")
    const [mediaReport, setMediaReport] = useState<any[] | null>(null)
    const [isReportExpanded, setIsReportExpanded] = useState(false)

    // Auto Backup State
    const [enableAutoBackup, setEnableAutoBackup] = useState(initialAutoBackup)
    const [autoBackupInterval, setAutoBackupInterval] = useState(initialInterval)
    const [isSavingSettings, setIsSavingSettings] = useState(false)

    // Calculate schedule
    const getLastBackupDate = () => {
        if (!lastAutoBackupAt) return null
        return new Date(lastAutoBackupAt)
    }

    const getNextBackupDate = () => {
        if (!enableAutoBackup) return null
        const last = getLastBackupDate()
        if (!last) return new Date() // If never backed up, it's due now

        const next = new Date(last)
        switch (autoBackupInterval) {
            case "1Day": next.setDate(next.getDate() + 1); break;
            case "1Week": next.setDate(next.getDate() + 7); break;
            case "1Month": next.setDate(next.getDate() + 30); break;
            case "6Month": next.setMonth(next.getMonth() + 6); break;
            case "1Year": next.setFullYear(next.getFullYear() + 1); break;
            default: next.setDate(next.getDate() + 7);
        }
        return next
    }

    const lastDate = getLastBackupDate()
    const nextDate = getNextBackupDate()

    useEffect(() => {
        // Load settings
        getAppConfig().then(config => {
            if (config) {
                setEnableAutoBackup(config.enableAutoBackup)
                setAutoBackupInterval(config.autoBackupInterval)

                // We do NOT trigger backup check here anymore. 
                // It should be handled by the cron job only.
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

            if (config?.redirectHomeToLogin) formData.append("redirectHomeToLogin", "on")
            if (config?.enableBlogging) formData.append("enableBlogging", "on")
            if (config?.enableMultiUser) formData.append("enableMultiUser", "on")
            if (config?.enableUserBlogging) formData.append("enableUserBlogging", "on")
            if (config?.analyticSnippet) formData.append("analyticSnippet", config.analyticSnippet)

            if (enableAutoBackup) formData.append("enableAutoBackup", "on")
            formData.append("autoBackupInterval", autoBackupInterval)

            await updateAppFeatures(null, formData)

            if (enableAutoBackup) {
                toast.info("Settings saved. Checking backup schedule...")
                // Trigger immediate check
                const cronRes = await fetch("/api/cron/backup")
                const cronData = await cronRes.json()

                if (cronData.message === "Auto backup completed") {
                    toast.success("Initial backup created successfully!")
                    router.refresh()
                } else {
                    toast.success("Auto backup enabled. Next run is scheduled.")
                }
            } else {
                toast.success("Auto backup settings saved")
            }

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

    const handleCleanup = async () => {
        setIsCleaning(true)
        setCleanProgress(10)
        setCleanStatus("Scanning for unreferenced media...")
        setMediaReport(null)

        try {
            const result = await cleanUnreferencedMedia()

            setCleanProgress(100)
            if (result.success) {
                toast.success(result.message)
                setCleanStatus(`Done! ${result.message}`)
                setMediaReport(result.mediaItems)
                setIsReportExpanded(true)
            } else {
                toast.error(result.message)
                setCleanStatus("Cleanup failed")
            }

            setTimeout(() => {
                setIsCleaning(false)
                setCleanProgress(0)
                setCleanStatus("")
            }, 3000)

        } catch (error) {
            toast.error("Cleanup failed")
            setIsCleaning(false)
            setCleanProgress(0)
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
                        <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2">
                            <div className="space-y-2">
                                <Label>Backup Frequency</Label>
                                <Select value={autoBackupInterval} onValueChange={setAutoBackupInterval}>
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="Select Frequency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1Day">Every 1 Day</SelectItem>
                                        <SelectItem value="1Week">Every 1 Week</SelectItem>
                                        <SelectItem value="1Month">Every 1 Month</SelectItem>
                                        <SelectItem value="6Month">Every 6 Months</SelectItem>
                                        <SelectItem value="1Year">Every 1 Year</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="rounded-lg border bg-muted/50 p-3 space-y-1.5 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Last Backup:</span>
                                    <span className="font-medium">
                                        {lastDate ? lastDate.toLocaleString() : "Never"}
                                    </span>
                                </div>
                                <div className="flex justify-between border-t pt-1.5 mt-1.5">
                                    <span className="text-muted-foreground">Next Scheduled:</span>
                                    <span className="font-semibold text-primary">
                                        {nextDate ? nextDate.toLocaleString() : "Pending..."}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <Button onClick={handleSaveAutoSettings} disabled={isSavingSettings} variant="secondary" size="sm">
                        {isSavingSettings ? "Saving..." : "Save Settings"}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <Trash2 className="h-5 w-5" />
                        Media Cleanup
                    </CardTitle>
                    <CardDescription>
                        Move files in <code className="bg-muted px-1 rounded">public/uploads</code> that are not used in any diary entries or blog posts to a <code className="bg-muted px-1 rounded">trash</code> folder.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        This operation will scan your entire database for image references. No files are permanently deleted; they are moved to a trash subfolder for manual review.
                    </p>

                    {isCleaning && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-muted-foreground animate-pulse">
                                <span>{cleanStatus}</span>
                                <span>{cleanProgress}%</span>
                            </div>
                            <Progress value={cleanProgress} className="h-2" />
                        </div>
                    )}

                    <Button
                        onClick={handleCleanup}
                        disabled={isCleaning}
                        variant="outline"
                        className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                        {isCleaning ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        Clean unreferenced media
                    </Button>

                    {mediaReport && (
                        <div className="mt-6 border-t pt-4">
                            <button
                                onClick={() => setIsReportExpanded(!isReportExpanded)}
                                className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
                            >
                                {isReportExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                <span>Media Index Report ({mediaReport.length} items)</span>
                            </button>

                            {isReportExpanded && (
                                <div className="mt-4 space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {mediaReport.map((item, idx) => (
                                        <div key={idx} className="flex flex-col p-3 rounded-lg border bg-muted/30 text-xs gap-2">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="font-mono truncate text-muted-foreground">{item.url}</span>
                                                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="shrink-0 hover:text-primary">
                                                        <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                </div>
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-full font-semibold shrink-0 uppercase tracking-wider text-[9px]",
                                                    item.status === 'unlinked' ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                                                )}>
                                                    {item.status === 'unlinked' ? 'Unlinked & Moved to Trash' : 'Referenced'}
                                                </span>
                                            </div>

                                            {item.sources.length > 0 && (
                                                <div className="flex flex-wrap gap-2 pt-1 border-t border-border/50">
                                                    <span className="text-muted-foreground italic mr-1">Used in:</span>
                                                    {item.sources.map((source: any, sIdx: number) => (
                                                        <div key={sIdx} className="inline-flex items-center gap-1 bg-background px-1.5 py-0.5 rounded border shadow-sm">
                                                            <span className="font-bold opacity-70">{source.type}:</span>
                                                            <span className="truncate max-w-[150px]">{source.title}</span>
                                                            {source.type === 'Entry' && (
                                                                <Link href={`/entries/${source.id}`} className="hover:text-primary ml-1">
                                                                    <ExternalLink className="h-2.5 w-2.5" />
                                                                </Link>
                                                            )}
                                                            {source.type === 'Blog Post' && (
                                                                <Link href={`/dashboard/blog/edit/${source.id}`} className="hover:text-primary ml-1">
                                                                    <ExternalLink className="h-2.5 w-2.5" />
                                                                </Link>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
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
