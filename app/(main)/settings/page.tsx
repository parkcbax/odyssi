import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { getAppConfig } from "@/app/lib/actions"
import { isAdmin } from "@/lib/auth-utils"
import { SettingsClient } from "@/components/settings/settings-client"

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
        <div className="max-w-4xl mx-auto">
            <SettingsClient
                user={user}
                journals={journals}
                appConfig={appConfig}
                isUserAdmin={isUserAdmin}
            />
        </div>
    )
}
