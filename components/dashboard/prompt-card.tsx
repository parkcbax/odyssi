"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles } from "lucide-react"
import Link from "next/link"
import { REFLECTION_PROMPTS } from "@/lib/prompts"

export function PromptCard() {
    const [prompt, setPrompt] = useState<string>("")

    useEffect(() => {
        const randomIndex = Math.floor(Math.random() * REFLECTION_PROMPTS.length)
        setPrompt(REFLECTION_PROMPTS[randomIndex])
    }, [])

    return (
        <Card className="bg-primary/5 border-primary/20 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                <Sparkles className="h-32 w-32 rotate-12" />
            </div>
            <CardHeader className="relative z-10">
                <div className="flex items-center gap-2 text-primary mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Sparkles className="h-5 w-5" />
                    </div>
                    <span className="font-bold text-xs uppercase tracking-[0.2em]">Today&apos;s Prompt</span>
                </div>
                <CardTitle className="text-2xl md:text-3xl font-serif italic text-foreground/90 leading-tight">
                    {prompt ? `"${prompt}"` : "..."}
                </CardTitle>
                <CardDescription className="text-base mt-4 max-w-lg">
                    Take a moment to breathe and reflect. Your journey is unique, and every thought matters.
                </CardDescription>
            </CardHeader>
            <CardFooter className="relative z-10 border-t bg-muted/30 py-4">
                <Button className="w-full sm:w-auto font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5" asChild size="lg">
                    <Link href="/entries/new">
                        Reflect Now
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    )
}
