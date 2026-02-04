import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { getAppConfig } from "@/app/lib/actions"

export default async function MainLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const config = await getAppConfig()

    return (
        <SidebarProvider>
            <AppSidebar enableBlogging={config.enableBlogging} />
            <main className="w-full">
                <div className="p-4">
                    <SidebarTrigger className="md:hidden" />
                    {children}
                </div>
            </main>
        </SidebarProvider>
    );
}
