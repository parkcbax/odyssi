import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarClock } from "lucide-react"

export function OnThisDayCard() {
    // Mock data - eventually verify if entries exist for this day/month in previous years
    const hasMemories = false

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <CalendarClock className="h-5 w-5 text-muted-foreground" />
                        On This Day
                    </CardTitle>
                    <span className="text-xs text-muted-foreground font-mono">
                        {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                    </span>
                </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center items-center text-center p-6 text-muted-foreground space-y-4">
                {hasMemories ? (
                    <div>Display memories here...</div>
                ) : (
                    <>
                        <div className="bg-muted rounded-full p-4 w-16 h-16 flex items-center justify-center mb-2">
                            <CalendarClock className="h-8 w-8 opacity-50" />
                        </div>
                        <p className="text-sm">No memories recorded on this day in previous years.</p>
                        <Button variant="ghost" size="sm" className="mt-2">
                            Write an entry for today
                        </Button>
                    </>
                )}
            </CardContent>
        </Card>
    )
}
