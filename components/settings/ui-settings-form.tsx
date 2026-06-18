"use client"

import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Laptop, Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"

const ACCENT_COLORS = [
    { name: "sage", color: "#768882", label: "Sage Green" },
    { name: "blue", color: "#2383e2", label: "Notion Blue" },
    { name: "orange", color: "#d9730d", label: "Orange" },
    { name: "yellow", color: "#cb912f", label: "Yellow" },
    { name: "red", color: "#d44c47", label: "Red" },
    { name: "purple", color: "#9065b0", label: "Purple" },
    { name: "pink", color: "#c14c8a", label: "Pink" },
]

interface UISettingsFormProps {
    enableBlogging?: boolean
}

export function UISettingsForm({ enableBlogging }: UISettingsFormProps) {
    const { theme, setTheme } = useTheme()
    const [font, setFont] = useState("inter")
    const [blogFont, setBlogFont] = useState("inter")
    const [blogSize, setBlogSize] = useState("medium")
    const [codeFont, setCodeFont] = useState("geist")
    const [accent, setAccent] = useState("sage")
    const [customColor, setCustomColor] = useState("#768882")

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

        const savedAccent = localStorage.getItem("odyssi-accent") || "sage"
        setAccent(savedAccent)
        document.documentElement.setAttribute("data-accent", savedAccent)

        const savedCustomColor = localStorage.getItem("odyssi-custom-accent") || "#768882"
        setCustomColor(savedCustomColor)
        if (savedAccent === "custom") {
            document.documentElement.style.setProperty("--custom-primary", savedCustomColor)
        }
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

    const handleAccentChange = (value: string) => {
        setAccent(value)
        localStorage.setItem("odyssi-accent", value)
        document.documentElement.setAttribute("data-accent", value)
        if (value === "custom") {
            document.documentElement.style.setProperty("--custom-primary", customColor)
        } else {
            document.documentElement.style.removeProperty("--custom-primary")
        }
    }

    const handleCustomColorChange = (value: string) => {
        let cleanVal = value
        if (cleanVal && !cleanVal.startsWith("#")) {
            cleanVal = "#" + cleanVal
        }
        setCustomColor(cleanVal)
        localStorage.setItem("odyssi-custom-accent", cleanVal)
        if (accent === "custom") {
            document.documentElement.style.setProperty("--custom-primary", cleanVal)
        }
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
                    <CardTitle>Accent Color</CardTitle>
                    <CardDescription>
                        Select a primary preset accent color or customize using a custom hex code.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Label>Selected:</Label>
                            <span className="text-sm font-medium text-muted-foreground">
                                {accent === "custom" ? `Custom (${customColor})` : (ACCENT_COLORS.find(c => c.name === accent)?.label || "Sage Green")}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {ACCENT_COLORS.map((item) => (
                                <button
                                    key={item.name}
                                    type="button"
                                    className={cn(
                                        "h-8 w-8 rounded-full transition-all border-2 flex items-center justify-center relative hover:scale-105 active:scale-95 cursor-pointer",
                                        accent === item.name ? "border-foreground scale-110" : "border-border hover:border-muted-foreground/30"
                                    )}
                                    style={{ backgroundColor: item.color }}
                                    onClick={() => handleAccentChange(item.name)}
                                    title={item.label}
                                >
                                    {accent === item.name && (
                                        <span className="text-white text-xs font-bold drop-shadow-xs">✓</span>
                                    )}
                                </button>
                            ))}
                            
                            {/* Custom Color Selector Button */}
                            <button
                                type="button"
                                className={cn(
                                    "h-8 w-8 rounded-full transition-all border-2 flex items-center justify-center relative hover:scale-105 active:scale-95 cursor-pointer",
                                    accent === "custom" ? "border-foreground scale-110" : "border-border hover:border-muted-foreground/30"
                                )}
                                style={{ background: "linear-gradient(135deg, #ff4500 0%, #ff8c00 17%, #ffd700 33%, #32cd32 50%, #1e90ff 67%, #9932cc 83%, #ff4500 100%)" }}
                                onClick={() => handleAccentChange("custom")}
                                title="Custom Hex Color"
                            >
                                {accent === "custom" && (
                                    <span className="text-white text-xs font-bold drop-shadow-xs">✓</span>
                                )}
                            </button>
                        </div>

                        {accent === "custom" && (
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-4 pt-3 border-t animate-in fade-in duration-200">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="custom-color-input" className="text-sm">Hex Code:</Label>
                                    <div className="flex items-center gap-1.5 border rounded-md px-2.5 py-1.5 bg-background text-sm max-w-[140px]">
                                        <span className="text-muted-foreground font-mono">#</span>
                                        <input
                                            id="custom-color-input"
                                            type="text"
                                            value={customColor.replace("#", "")}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val.length <= 6) {
                                                    handleCustomColorChange("#" + val);
                                                }
                                            }}
                                            placeholder="768882"
                                            className="w-full bg-transparent border-0 outline-none p-0 text-sm font-mono"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="custom-color-picker" className="text-sm">Color Picker:</Label>
                                    <input
                                        id="custom-color-picker"
                                        type="color"
                                        value={customColor}
                                        onChange={(e) => handleCustomColorChange(e.target.value)}
                                        className="w-8 h-8 rounded border p-0 cursor-pointer overflow-hidden"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
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
