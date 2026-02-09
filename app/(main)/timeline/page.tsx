import { TimelineViews } from "@/components/timeline/timeline-views"
import { Suspense } from "react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { List, Calendar as CalendarIcon } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export const dynamic = 'force-dynamic'

export default async function TimelinePage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const session = await auth()
    if (!session?.user?.id) return null

    const resolvedParams = await searchParams
    const tag = typeof resolvedParams.tag === 'string' ? resolvedParams.tag : undefined
    const location = typeof resolvedParams.location === 'string' ? resolvedParams.location : undefined

    // Fetch entries once for both views
    const entries = await prisma.entry.findMany({
        where: {
            journal: {
                userId: session.user.id
            },
            ...(tag && {
                tags: {
                    some: {
                        name: tag
                    }
                }
            }),
            ...(location && {
                locationName: location
            })
        },
        orderBy: {
            date: 'desc'
        },
        include: {
            journal: true,
            tags: true,
            images: true
        }
    })

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Timeline</h1>
                    <p className="text-muted-foreground">Your journey through time.</p>
                    {(tag || location) && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                            <span>
                                Filtering by {tag ? `tag: ${tag}` : `location: ${location}`}
                            </span>
                            <Link href="/timeline" className="text-primary hover:underline">
                                Clear filter
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            <TimelineViews entries={entries} />
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
