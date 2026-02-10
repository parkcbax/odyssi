"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { List, Calendar as CalendarIcon } from "lucide-react"
import { TimelineList } from "./timeline-list"
import { TimelineCalendar } from "./timeline-calendar"
import { useSearchParams, useRouter, usePathname } from "next/navigation"

interface TimelineViewsProps {
    entries: any[]
    defaultView?: "list" | "calendar"
}

export function TimelineViews({ entries, defaultView = "list" }: TimelineViewsProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Sync tab state with URL or local state if preferred. 
    // Using simple state for now or just relying on Tabs default.
    // Changing tabs doesn't necessarily need to update URL unless we want deep linking.

    return (
        <Tabs defaultValue={defaultView} className="w-full">
            <div className="flex justify-center mb-8">
                <TabsList className="grid w-full max-w-[400px] grid-cols-2">
                    <TabsTrigger value="list" className="flex items-center gap-2">
                        <List className="h-4 w-4" />
                        List View
                    </TabsTrigger>
                    <TabsTrigger value="calendar" className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        Calendar View
                    </TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="list" className="mt-0">
                <TimelineList entries={entries} />
            </TabsContent>

            <TabsContent value="calendar" className="mt-0">
                <TimelineCalendar entries={entries} />
            </TabsContent>
        </Tabs>
    )
}
