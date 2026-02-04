"use client"

import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Laptop, Moon, Sun } from "lucide-react"

export function UISettingsForm() {
    const { theme, setTheme } = useTheme()
    const [font, setFont] = useState("inter")

    useEffect(() => {
        const savedFont = localStorage.getItem("odyssi-font") || "inter"
        setFont(savedFont)
        document.documentElement.setAttribute("data-font", savedFont)
    }, [])

    const handleFontChange = (value: string) => {
        setFont(value)
        localStorage.setItem("odyssi-font", value)
        document.documentElement.setAttribute("data-font", value)
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Theme</CardTitle>
                    <CardDescription>
                        Select the appearance of the application.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <RadioGroup
                        defaultValue={theme}
                        onValueChange={(v) => setTheme(v)}
                        className="grid max-w-md grid-cols-3 gap-8"
                    >
                        <div>
                            <Label
                                htmlFor="light"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                            >
                                <RadioGroupItem value="light" id="light" className="sr-only" />
                                <Sun className="mb-3 h-6 w-6" />
                                <span className="block w-full text-center font-normal">
                                    Light
                                </span>
                            </Label>
                        </div>
                        <div>
                            <Label
                                htmlFor="dark"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                            >
                                <RadioGroupItem value="dark" id="dark" className="sr-only" />
                                <Moon className="mb-3 h-6 w-6" />
                                <span className="block w-full text-center font-normal">
                                    Dark
                                </span>
                            </Label>
                        </div>
                        <div>
                            <Label
                                htmlFor="system"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                            >
                                <RadioGroupItem value="system" id="system" className="sr-only" />
                                <Laptop className="mb-3 h-6 w-6" />
                                <span className="block w-full text-center font-normal">
                                    System
                                </span>
                            </Label>
                        </div>
                    </RadioGroup>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Typography</CardTitle>
                    <CardDescription>
                        Choose your preferred font style for comfortable reading.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Interface Font</Label>
                        <Select value={font} onValueChange={handleFontChange}>
                            <SelectTrigger className="w-[280px]">
                                <SelectValue placeholder="Select a font" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="inter">Inter (Default)</SelectItem>
                                <SelectItem value="kanit">Kanit</SelectItem>
                                <SelectItem value="prompt">Prompt</SelectItem>
                                <SelectItem value="roboto">Roboto</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
