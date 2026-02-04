"use client"

import {
    Calendar,
    Activity,
    Book,
    BarChart,
    Settings,
    MessageSquare,
    LogOut,
    Plus,
    Archive
} from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const items = [
    {
        title: "Today",
        url: "/dashboard",
        icon: Calendar,
    },
    {
        title: "Timeline",
        url: "/timeline",
        icon: Activity,
    },
    {
        title: "Journals",
        url: "/journals",
        icon: Book,
    },
    {
        title: "Insights",
        url: "/insights",
        icon: BarChart,
    },
]

import { usePathname } from "next/navigation"

interface AppSidebarProps {
    enableBlogging?: boolean
}

export function AppSidebar({ enableBlogging }: AppSidebarProps) {
    const pathname = usePathname()

    const navItems = [...items]
    if (enableBlogging) {
        navItems.push({
            title: "Blog",
            url: "/dashboard/blog",
            icon: Book, // You might want a different icon for Blog
        })
    }

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className="p-4 border-b">
                <h1 className="text-xl font-bold tracking-tight text-primary">Odyssi</h1>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <div className="px-4 py-2">
                        <Button className="w-full justify-start gap-2" size="lg" asChild>
                            <Link href="/entries/new">
                                <Plus className="h-4 w-4" />
                                <span>New Entry</span>
                            </Link>
                        </Button>
                    </div>
                    <SidebarGroupContent className="mt-2">
                        <SidebarMenu>
                            {navItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        tooltip={item.title}
                                        isActive={pathname?.startsWith(item.url)}
                                    >
                                        <Link href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="Settings" isActive={pathname?.startsWith("/settings")}>
                            <Link href="/settings">
                                <Settings />
                                <span>Settings</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="Feedback" isActive={pathname?.startsWith("/feedback")}>
                            <Link href="/feedback">
                                <MessageSquare />
                                <span>Feedback</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="Sign Out">
                            <Link href="/api/auth/signout">
                                <LogOut />
                                <span>Sign Out</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
