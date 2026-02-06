import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileForm } from "@/components/settings/profile-form"
import { UISettingsForm } from "@/components/settings/ui-settings-form"
import { BackupView } from "@/components/backup-restore/backup-view"
import { RestoreView } from "@/components/backup-restore/restore-view"
import { AdditionalFeaturesForm } from "@/components/settings/additional-features-form"
import { User, Palette, Archive, RotateCcw, Sparkles, Globe } from "lucide-react"
import { SharedEntriesList } from "@/components/settings/shared-entries-list"
import { getAppConfig } from "@/app/lib/actions"

import { isAdmin } from "@/lib/auth-utils"

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
    const session = await auth()
    if (!session?.user?.id) return redirect("/login")

    const isUserAdmin = isAdmin(session?.user?.email)

    const [user, journals, appConfig] = await Promise.all([
        prisma.user.findUnique({
            where: { id: session.user.id },
            select: { name: true, email: true, timezone: true }
        }),
        prisma.journal.findMany({
            where: { userId: session.user.id },
            select: { id: true, title: true }
        }),
        getAppConfig()
    ])

    if (!user) return redirect("/login")

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your account settings and preferences.</p>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="bg-muted/50 p-1 w-full sm:w-auto overflow-x-auto flex justify-start">
                    <TabsTrigger value="profile" className="gap-2">
                        <User className="h-4 w-4" />
                        Profile
                    </TabsTrigger>

                    {isUserAdmin && (
                        <>
                            <TabsTrigger value="ui" className="gap-2">
                                <Palette className="h-4 w-4" />
                                UI Settings
                            </TabsTrigger>
                            <TabsTrigger value="additional" className="gap-2">
                                <Sparkles className="h-4 w-4" />
                                Additional Feature
                            </TabsTrigger>
                            <TabsTrigger value="public-share" className="gap-2">
                                <Globe className="h-4 w-4" />
                                Public Share
                            </TabsTrigger>
                            <TabsTrigger value="backup" className="gap-2">
                                <Archive className="h-4 w-4" />
                                Backup
                            </TabsTrigger>
                            <TabsTrigger value="restore" className="gap-2">
                                <RotateCcw className="h-4 w-4" />
                                Restore
                            </TabsTrigger>
                        </>
                    )}
                </TabsList>

                <TabsContent value="profile" className="space-y-6">
                    <ProfileForm user={user} />
                </TabsContent>

                <TabsContent value="ui" className="space-y-6">
                    <UISettingsForm enableBlogging={appConfig.enableBlogging} />
                </TabsContent>

                <TabsContent value="additional" className="space-y-6">
                    <AdditionalFeaturesForm
                        redirectHomeToLogin={appConfig.redirectHomeToLogin}
                        enableBlogging={appConfig.enableBlogging}
                        enableMultiUser={appConfig.enableMultiUser}
                        enableUserBlogging={appConfig.enableUserBlogging}
                    />
                </TabsContent>

                <TabsContent value="public-share" className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-medium">Publicly Shared Entries</h3>
                            <p className="text-sm text-muted-foreground">
                                Manage entries that are currently accessible to the public.
                            </p>
                        </div>
                        <SharedEntriesList isAdmin={isUserAdmin} />
                    </div>
                </TabsContent>

                <TabsContent value="backup" className="space-y-6">
                    <BackupView
                        journals={journals}
                        initialAutoBackup={appConfig.enableAutoBackup}
                        initialInterval={appConfig.autoBackupInterval}
                    />
                </TabsContent>

                <TabsContent value="restore" className="space-y-6">
                    <RestoreView />
                </TabsContent>
            </Tabs>
        </div>
    )
}
