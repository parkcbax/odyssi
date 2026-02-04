import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles } from "lucide-react"

export function PromptCard() {
    return (
        <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
                <div className="flex items-center gap-2 text-primary mb-2">
                    <Sparkles className="h-5 w-5" />
                    <span className="font-semibold text-sm uppercase tracking-wider">Today&apos;s Prompt</span>
                </div>
                <CardTitle className="text-2xl font-serif italic text-foreground/90">
                    &quot;What is a small victory you celebrated recently?&quot;
                </CardTitle>
                <CardDescription>
                    Take a moment to appreciate your progress, no matter how small.
                </CardDescription>
            </CardHeader>
            <CardFooter>
                <Button className="w-full sm:w-auto font-medium">
                    Reflect Now
                </Button>
            </CardFooter>
        </Card>
    )
}
