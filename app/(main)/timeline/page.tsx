import { TimelineList } from "@/components/timeline/timeline-list"
import { TimelineCalendar } from "@/components/timeline/timeline-calendar"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { List, Calendar as CalendarIcon } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export default async function TimelinePage() {
    const session = await auth()
    if (!session?.user?.id) return null

    // Fetch entries once for both views
    const entries = await prisma.entry.findMany({
        where: {
            journal: {
                userId: session.user.id
            }
        },
        orderBy: {
            date: 'desc'
        },
        include: {
            journal: true,
            tags: true
        }
    })

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Timeline</h1>
                    <p className="text-muted-foreground">Your journey through time.</p>
                </div>
            </div>

            <Tabs defaultValue="list" className="w-full">
                <div className="flex justify-center mb-8">
                    <TabsList className="grid w-[400px] grid-cols-2">
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
        </div>
    )
}

function TimelineSkeleton() {
    return (
        <div className="space-y-8">
            {[1, 2].map((i) => (
                <div key={i} className="space-y-4">
                    <Skeleton className="h-8 w-32" />
                    {[1, 2, 3].map((j) => (
                        <Skeleton key={j} className="h-32 w-full rounded-xl" />
                    ))}
                </div>
            ))}
        </div>
    )
}
