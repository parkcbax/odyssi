import { getInsightsData } from "@/app/lib/actions-insights"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Flame, BookOpen, PenTool, LayoutTemplate, Activity } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function InsightsPage() {
    const data = await getInsightsData()

    if (!data) return null

    return (
        <div className="flex flex-col gap-8 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Insights</h1>
                    <p className="text-muted-foreground">Your writing habits and statistics.</p>
                </div>
            </div>

            {/* Top Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                        <Flame className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.currentStreak} Days</div>
                        <p className="text-xs text-muted-foreground">
                            Keep it burning!
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Longest Streak</CardTitle>
                        <Activity className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.longestStreak} Days</div>
                        <p className="text-xs text-muted-foreground">
                            Your personal best
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
                        <BookOpen className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.totalEntries}</div>
                        <p className="text-xs text-muted-foreground">
                            Moments captured
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Words</CardTitle>
                        <PenTool className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.totalWords.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            Words written
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {/* Mood Distribution */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Mood Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data.moodDistribution.length > 0 ? (
                                data.moodDistribution.map((item) => (
                                    <div key={item.mood} className="flex items-center">
                                        <div className="text-xl w-8 text-center">{item.mood}</div>
                                        <div className="flex-1 ml-2">
                                            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary rounded-full"
                                                    style={{ width: `${(item.count / data.totalEntries) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="w-12 text-right text-sm text-muted-foreground">
                                            {item.count}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">No mood data available yet.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Day Distribution */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Writing Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end justify-between h-[200px] mt-4 px-2">
                            <div className="flex items-end justify-between h-[200px] mt-4 px-2">
                                {data.totalEntries > 0 ? (
                                    data.dayDistribution.map((item) => {
                                        const maxCount = Math.max(...data.dayDistribution.map(d => d.count))
                                        const heightPercentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0

                                        return (
                                            <div key={item.day} className="flex flex-col items-center gap-2 group">
                                                <div className="relative w-8 bg-secondary rounded-t-sm h-full flex items-end overflow-hidden group-hover:bg-secondary/80 transition-colors">
                                                    <div
                                                        className="w-full bg-primary/80 group-hover:bg-primary transition-all duration-500"
                                                        style={{ height: `${heightPercentage}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-muted-foreground font-medium">{item.day}</span>
                                                <span className="sr-only">{item.count} entries</span>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                                        No writing activity recorded yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
