"use client"

import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Laptop, Moon, Sun } from "lucide-react"

interface UISettingsFormProps {
    enableBlogging?: boolean
}

export function UISettingsForm({ enableBlogging }: UISettingsFormProps) {
    const { theme, setTheme } = useTheme()
    const [font, setFont] = useState("inter")
    const [blogFont, setBlogFont] = useState("inter")
    const [blogSize, setBlogSize] = useState("medium")
    const [codeFont, setCodeFont] = useState("geist")

    useEffect(() => {
        const savedFont = localStorage.getItem("odyssi-font") || "inter"
        setFont(savedFont)
        document.documentElement.setAttribute("data-font", savedFont)

        const savedBlogFont = localStorage.getItem("odyssi-blog-font") || "inter"
        setBlogFont(savedBlogFont)
        document.documentElement.setAttribute("data-blog-font", savedBlogFont)

        const savedBlogSize = localStorage.getItem("odyssi-blog-size") || "medium"
        setBlogSize(savedBlogSize)
        document.documentElement.setAttribute("data-blog-size", savedBlogSize)

        const savedCodeFont = localStorage.getItem("odyssi-code-font") || "geist"
        setCodeFont(savedCodeFont)
        document.documentElement.setAttribute("data-code-font", savedCodeFont)
    }, [])

    const handleFontChange = (value: string) => {
        setFont(value)
        localStorage.setItem("odyssi-font", value)
        document.documentElement.setAttribute("data-font", value)
    }

    const handleBlogFontChange = (value: string) => {
        setBlogFont(value)
        localStorage.setItem("odyssi-blog-font", value)
        document.documentElement.setAttribute("data-blog-font", value)
    }

    const handleBlogSizeChange = (value: string) => {
        setBlogSize(value)
        localStorage.setItem("odyssi-blog-size", value)
        document.documentElement.setAttribute("data-blog-size", value)
    }

    const handleCodeFontChange = (value: string) => {
        setCodeFont(value)
        localStorage.setItem("odyssi-code-font", value)
        document.documentElement.setAttribute("data-code-font", value)
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
                                <SelectItem value="inter" className="font-preview" style={{ fontFamily: 'var(--font-geist-sans)' }}>Inter (Default)</SelectItem>
                                <SelectItem value="kanit" className="font-preview" style={{ fontFamily: 'var(--font-kanit)' }}>Kanit</SelectItem>
                                <SelectItem value="prompt" className="font-preview" style={{ fontFamily: 'var(--font-prompt)' }}>Prompt</SelectItem>
                                <SelectItem value="roboto" className="font-preview" style={{ fontFamily: 'var(--font-roboto)' }}>Roboto</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {enableBlogging && (
                <Card>
                    <CardHeader>
                        <CardTitle>Blog Typography</CardTitle>
                        <CardDescription>
                            Customize the reading experience for blog posts.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Blog Font</Label>
                                <Select value={blogFont} onValueChange={handleBlogFontChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a font" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="inter" className="font-preview" style={{ fontFamily: 'var(--font-geist-sans)' }}>Inter (Sans-serif)</SelectItem>
                                        <SelectItem value="kanit" className="font-preview" style={{ fontFamily: 'var(--font-kanit)' }}>Kanit (Sans-serif)</SelectItem>
                                        <SelectItem value="prompt" className="font-preview" style={{ fontFamily: 'var(--font-prompt)' }}>Prompt (Sans-serif)</SelectItem>
                                        <SelectItem value="roboto" className="font-preview" style={{ fontFamily: 'var(--font-roboto)' }}>Roboto (Sans-serif)</SelectItem>
                                        <SelectItem value="serif" className="font-preview" style={{ fontFamily: 'var(--font-lora)' }}>Serif (Classic)</SelectItem>
                                        <SelectItem value="mono" className="font-preview" style={{ fontFamily: 'var(--font-geist-mono)' }}>Monospace (Code)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Font Size</Label>
                                <Select value={blogSize} onValueChange={handleBlogSizeChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a size" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="small">Small</SelectItem>
                                        <SelectItem value="medium">Medium (Default)</SelectItem>
                                        <SelectItem value="large">Large</SelectItem>
                                        <SelectItem value="xl">Extra Large</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Code Block Typography</CardTitle>
                    <CardDescription>
                        Set the font style for code snippets and technical blocks.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Code Font</Label>
                        <Select value={codeFont} onValueChange={handleCodeFontChange}>
                            <SelectTrigger className="w-[280px]">
                                <SelectValue placeholder="Select a code font" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="geist" className="font-preview" style={{ fontFamily: 'var(--font-geist-mono)' }}>Geist Mono (Default)</SelectItem>
                                <SelectItem value="jetbrains" className="font-preview" style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>JetBrains Mono</SelectItem>
                                <SelectItem value="fira" className="font-preview" style={{ fontFamily: 'var(--font-fira-code)' }}>Fira Code</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
