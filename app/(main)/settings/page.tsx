import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileForm } from "@/components/settings/profile-form"
import { UISettingsForm } from "@/components/settings/ui-settings-form"
import { User, Palette, Shield } from "lucide-react"

export default async function SettingsPage() {
    const session = await auth()
    if (!session?.user?.id) return redirect("/login")

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true }
    })

    if (!user) return redirect("/login")

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your account settings and preferences.</p>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="bg-muted/50 p-1">
                    <TabsTrigger value="profile" className="gap-2">
                        <User className="h-4 w-4" />
                        Profile
                    </TabsTrigger>
                    <TabsTrigger value="ui" className="gap-2">
                        <Palette className="h-4 w-4" />
                        UI Settings
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-6">
                    <ProfileForm user={user} />
                </TabsContent>

                <TabsContent value="ui" className="space-y-6">
                    <UISettingsForm />
                </TabsContent>
            </Tabs>
        </div>
    )
}
