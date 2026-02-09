import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { getAppConfig } from "@/app/lib/actions"
import { auth } from "@/auth"
import { isAdmin } from "@/lib/auth-utils"

export const dynamic = 'force-dynamic'

export default async function MainLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const config = await getAppConfig()
    const session = await auth()
    const isUserAdmin = isAdmin(session?.user?.email)

    return (
        <SidebarProvider>
            <AppSidebar
                enableBlogging={config?.enableBlogging ?? false}
                isAdmin={isUserAdmin}
                enableMultiUser={config?.enableMultiUser ?? false}
                enableUserBlogging={config?.enableUserBlogging ?? false}
            />
            <main className="w-full">
                <div className="p-4">
                    <SidebarTrigger className="md:hidden" />
                    {children}
                </div>
            </main>
        </SidebarProvider>
    );
}
