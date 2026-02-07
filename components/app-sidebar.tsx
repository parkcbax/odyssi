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
    Archive,
    Search
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
import Image from "next/image"

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
    {
        title: "Search",
        url: "/search",
        icon: Search,
    },
]

import { usePathname } from "next/navigation"

import { Users } from "lucide-react"

interface AppSidebarProps {
    enableBlogging?: boolean
    isAdmin?: boolean
    enableMultiUser?: boolean
    enableUserBlogging?: boolean
}

import { handleSignOut } from "@/app/lib/actions"

export function AppSidebar({ enableBlogging, isAdmin, enableMultiUser, enableUserBlogging }: AppSidebarProps) {
    const pathname = usePathname()

    const navItems = [...items]
    // Show Blog if enabled globally AND (user is admin OR user blogging is enabled)
    // Note: If isAdmin is undefined (e.g. loading), we default to false for security, 
    // but typically layout passes correct value.
    const canBlog = isAdmin || enableUserBlogging

    if (enableBlogging && canBlog) {
        navItems.push({
            title: "Blog",
            url: "/dashboard/blog",
            icon: Book, // You might want a different icon for Blog
        })
    }

    if (isAdmin && enableMultiUser) {
        navItems.push({
            title: "Users",
            url: "/users",
            icon: Users,
        })
    }

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className="p-4 border-b">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="relative h-8 w-8">
                        <Image src="/assets/odyssi_logo.png" alt="Odyssi Logo" fill className="object-contain" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-primary">Odyssi</span>
                </Link>
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
                        <SidebarMenuButton asChild tooltip="Sign Out">
                            <button onClick={() => handleSignOut()}>
                                <LogOut />
                                <span>Sign Out</span>
                            </button>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
