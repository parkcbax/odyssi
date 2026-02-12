'use client'

import { getInsightsData, InsightData } from "@/app/lib/actions-insights"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Flame, BookOpen, PenTool, Activity, Tag, MapPin } from "lucide-react"
import { useEffect, useState } from "react"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import Link from "next/link"

export default function InsightsPage() {
    const [data, setData] = useState<InsightData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getInsightsData().then(d => {
            setData(d)
            setLoading(false)
        })
    }, [])

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Loading insights...</div>
    }

    if (!data) return <div className="p-8 text-center text-muted-foreground">No data available.</div>

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

                {/* Day Distribution (Word Count) */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Writing Activity (Words)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.dayDistribution}>
                                    <XAxis
                                        dataKey="day"
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `${value}`}
                                    />
                                    <Tooltip
                                        cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '4 4' }}
                                        content={({ active, payload, label }) => {
                                            // Custom tooltip content
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="rounded-lg border bg-popover p-2 shadow-sm">
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div className="flex flex-col">
                                                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                                    {label}
                                                                </span>
                                                                <span className="font-bold text-muted-foreground">
                                                                    {payload[0].value} words
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            }
                                            return null
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="count"
                                        stroke="var(--chart-1)"
                                        strokeWidth={2}
                                        fillOpacity={0.5}
                                        fill="var(--chart-1)"
                                        dot={{ r: 4, fill: "var(--chart-1)", strokeWidth: 2, stroke: "var(--background)" }}
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {/* Tags Distribution */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            Top Tags
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data.tagsDistribution.length > 0 ? (
                                data.tagsDistribution.map((item) => (
                                    <Link
                                        key={item.tag}
                                        href={`/timeline?tag=${encodeURIComponent(item.tag)}`}
                                        className="flex items-center justify-between group cursor-pointer hover:bg-muted/50 p-1 rounded-md transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-primary" />
                                            <span className="font-medium group-hover:text-primary transition-colors">{item.tag}</span>
                                        </div>
                                        <span className="text-sm text-muted-foreground">{item.count}</span>
                                    </Link>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">No tags used yet.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Location Distribution */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Top Locations
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data.locationDistribution.length > 0 ? (
                                data.locationDistribution.map((item) => (
                                    <Link
                                        key={item.location}
                                        href={`/timeline?location=${encodeURIComponent(item.location)}`}
                                        className="flex items-center justify-between group cursor-pointer hover:bg-muted/50 p-1 rounded-md transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-orange-500" />
                                            <span className="font-medium group-hover:text-primary transition-colors">{item.location}</span>
                                        </div>
                                        <span className="text-sm text-muted-foreground">{item.count}</span>
                                    </Link>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">No location data available yet.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
