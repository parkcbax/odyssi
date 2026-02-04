import { PromptCard } from "@/components/dashboard/prompt-card"
import { OnThisDayCard } from "@/components/dashboard/on-this-day-card"
import { RecentEntriesList } from "@/components/dashboard/recent-entries-list"

export default function DashboardPage() {
    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">Welcome back, Traveler.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-1">
                <PromptCard />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <RecentEntriesList />
                </div>
                <div className="lg:col-span-1">
                    <OnThisDayCard />
                </div>
            </div>
        </div>
    )
}
