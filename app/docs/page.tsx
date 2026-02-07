"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import {
    Book, Download, RotateCcw, Shield, Terminal,
    Settings, AlertCircle, Trash2, Archive,
    Globe, Sparkles, Search
} from "lucide-react"
import { cn } from "@/lib/utils"

const DOC_SECTIONS = [
    {
        group: "Getting Started",
        items: [
            { id: "introduction", label: "Introduction" },
            { id: "installation-local", label: "Local Setup" },
            { id: "installation-docker", label: "Docker Setup" },
        ]
    },
    {
        group: "Features",
        items: [
            { id: "backup-restore", label: "Backup & Restore" },
            { id: "media-cleanup", label: "Media Cleanup" },
            { id: "public-sharing", label: "Public Sharing" },
        ]
    },
    {
        group: "Help",
        items: [
            { id: "troubleshooting", label: "Troubleshooting" },
        ]
    }
]

export default function DocsPage() {
    const [searchQuery, setSearchQuery] = useState("")

    const filteredSections = useMemo(() => {
        if (!searchQuery) return DOC_SECTIONS

        return DOC_SECTIONS.map(group => ({
            ...group,
            items: group.items.filter(item =>
                item.label.toLowerCase().includes(searchQuery.toLowerCase())
            )
        })).filter(group => group.items.length > 0)
    }, [searchQuery])

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <header className="px-4 lg:px-6 h-14 flex items-center border-b sticky top-0 z-50 bg-background/80 backdrop-blur-md">
                <Link className="flex items-center justify-center gap-2 font-bold text-xl" href="/">
                    <span className="text-primary font-bold">Odyssi</span>
                    <span className="hidden sm:inline text-muted-foreground font-light px-2 border-l">Documentation</span>
                </Link>
                <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
                    <Link className="text-sm font-medium hover:text-primary transition-colors" href="/">
                        Home
                    </Link>
                    <Link className="text-sm font-medium hover:text-primary transition-colors" href="/login">
                        Login
                    </Link>
                </nav>
            </header>

            <div className="container mx-auto px-4 md:px-6 flex-1 lg:grid lg:grid-cols-[260px_1fr] lg:gap-10 py-8 lg:py-12">
                <aside className="sticky top-20 h-[calc(100vh-120px)] overflow-y-auto hidden lg:block pr-4 custom-scrollbar">
                    <div className="mb-8 relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Search docs..."
                            className="pl-9 bg-muted/40 border-muted-foreground/10 focus-visible:border-primary/50 focus-visible:ring-primary/20 focus-visible:bg-background h-10 transition-all rounded-xl"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="space-y-8">
                        {filteredSections.map((group, idx) => (
                            <div key={idx} className="animate-in fade-in slide-in-from-left-4 duration-500">
                                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground/50">
                                    {group.group}
                                </h4>
                                <div className="grid grid-flow-row auto-rows-max text-sm gap-1">
                                    {group.items.map(item => (
                                        <a
                                            key={item.id}
                                            href={`#${item.id}`}
                                            className="flex w-full items-center rounded-lg p-2 hover:bg-muted font-medium transition-colors text-muted-foreground hover:text-foreground"
                                        >
                                            {item.label}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {filteredSections.length === 0 && (
                            <div className="text-center py-12 px-4 border rounded-xl bg-muted/20">
                                <p className="text-sm text-muted-foreground">No results found for "{searchQuery}"</p>
                            </div>
                        )}
                    </div>
                </aside>

                <main className="prose prose-neutral dark:prose-invert max-w-none prose-headings:scroll-m-20 prose-h1:text-4xl prose-h1:font-extrabold prose-h1:tracking-tight prose-h1:lg:text-5xl prose-h2:text-3xl prose-h2:font-bold prose-h2:tracking-tight prose-h2:border-b prose-h2:pb-2 prose-h3:text-xl prose-h3:font-bold">
                    <section id="introduction">
                        <h1>Introduction</h1>
                        <p className="text-xl text-muted-foreground leading-relaxed">
                            Odyssi is a modern, minimalist, and self-hosted sanctuary for your thoughts.
                            It focuses on privacy, beauty, and data ownership, allowing you to journal without distraction
                            or fear of third-party tracking.
                        </p>
                        <div className="grid sm:grid-cols-2 gap-4 mt-8 not-prose">
                            <div className="p-6 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors">
                                <Shield className="h-8 w-8 text-primary mb-3" />
                                <h3 className="font-bold mb-1">Privacy First</h3>
                                <p className="text-sm text-muted-foreground">Everything is hosted on your own hardware. You own 100% of your data.</p>
                            </div>
                            <div className="p-6 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors">
                                <Sparkles className="h-8 w-8 text-primary mb-3" />
                                <h3 className="font-bold mb-1">Modern UI</h3>
                                <p className="text-sm text-muted-foreground">Built with React, Next.js, and Tailwind CSS for a fast, responsive experience.</p>
                            </div>
                        </div>
                    </section>

                    <Separator className="my-12" />

                    <section id="installation-local">
                        <h2>Local Installation</h2>
                        <p>To run Odyssi locally for development or manual hosting, follow these steps:</p>
                        <ol className="mt-4 space-y-4">
                            <li>
                                <strong>Clone the repo:</strong>
                                <pre className="bg-muted p-4 rounded-lg mt-2 overflow-x-auto text-sm border">git clone https://github.com/parkcbax/odyssi.git</pre>
                            </li>
                            <li>
                                <strong>Install dependencies:</strong>
                                <pre className="bg-muted p-4 rounded-lg mt-2 overflow-x-auto text-sm border">npm install</pre>
                            </li>
                            <li>
                                <strong>Configure Environment:</strong>
                                <p className="text-sm text-muted-foreground mt-2">Create a <code>.env</code> file based on <code>.env.example</code>. You must provide a <code>DATABASE_URL</code> and <code>AUTH_SECRET</code>.</p>
                            </li>
                            <li>
                                <strong>Run Migrations & Seed:</strong>
                                <pre className="bg-muted p-4 rounded-lg mt-2 overflow-x-auto text-sm border">npx prisma migrate dev{"\n"}npx prisma db seed</pre>
                            </li>
                            <li>
                                <strong>Start Dev Server:</strong>
                                <pre className="bg-muted p-4 rounded-lg mt-2 overflow-x-auto text-sm border">npm run dev</pre>
                            </li>
                        </ol>
                    </section>

                    <Separator className="my-12" />

                    <section id="installation-docker">
                        <h2>Docker Installation</h2>
                        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 mb-6 not-prose">
                            <p className="text-sm m-0"><strong>Tip:</strong> Docker is the recommended way to host Odyssi in production (e.g., on a NAS or VPS).</p>
                        </div>
                        <p>Use the provided <code>docker-compose.yml</code> to get up and running quickly:</p>
                        <pre className="bg-muted p-4 rounded-lg mt-4 overflow-x-auto text-sm border"># Build and start the containers{"\n"}docker-compose up -d --build</pre>
                        <p className="mt-4">This will start both the Next.js application and a PostgreSQL database. The application will be accessible at <code>http://localhost:3000</code>.</p>
                    </section>

                    <Separator className="my-12" />

                    <section id="backup-restore">
                        <div className="flex items-center gap-3 mb-6 not-prose">
                            <Archive className="h-8 w-8 text-primary" />
                            <h2 className="text-3xl font-bold tracking-tight m-0">Backup & Restore</h2>
                        </div>
                        <p>Protecting your memories is critical. Odyssi provides built-in tools for manual and automatic backups.</p>

                        <h3>Manual Backup</h3>
                        <p>Navigate to <strong>Settings &gt; Backup</strong>. You can choose to export a single journal or your entire library, including all images and settings. The result is a secure ZIP archive.</p>

                        <h3>Automatic Backups</h3>
                        <p>Enable automatic backups in the settings to have Odyssi periodically generate archives without manual intervention.</p>

                        <h3>Restoring</h3>
                        <p>Navigate to <strong>Settings &gt; Restore</strong> and upload one of your previously exported ZIP archives. Odyssi will overwrite existing entries and media if conflicts occur.</p>
                    </section>

                    <Separator className="my-12" />

                    <section id="media-cleanup">
                        <div className="flex items-center gap-3 mb-6 not-prose">
                            <Trash2 className="h-8 w-8 text-primary" />
                            <h2 className="text-3xl font-bold tracking-tight m-0">Media Cleanup</h2>
                        </div>
                        <p>Over time, you might upload images that are no longer used in any entries (orphaned files). Odyssi includes an intelligent cleanup tool.</p>
                        <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20 my-6 not-prose">
                            <p className="text-sm m-0"><strong>Safety Note:</strong> Files aren't deleted immediately. They are moved to a <code>trash</code> folder for manual review.</p>
                        </div>
                        <p>Running the cleanup will provide a <strong>Media Index Report</strong>, showing exactly where each file is referenced or if it has been moved to trash.</p>
                    </section>

                    <Separator className="my-12" />

                    <section id="public-sharing">
                        <div className="flex items-center gap-3 mb-6 not-prose">
                            <Globe className="h-8 w-8 text-primary" />
                            <h2 className="text-3xl font-bold tracking-tight m-0">Public Sharing</h2>
                        </div>
                        <p>While Odyssi is private, you can choose to share specific entries or blog posts with the world.</p>
                        <ul>
                            <li><strong>Public Slugs:</strong> Create custom URLs for your shared entries.</li>
                            <li><strong>Auto-Expiration:</strong> Set links to expire automatically after a certain time.</li>
                            <li><strong>Blog Feature:</strong> Enable the blog to create a continuous public record of your journey.</li>
                        </ul>
                    </section>

                    <Separator className="my-12" />

                    <section id="troubleshooting" className="pb-24">
                        <div className="flex items-center gap-3 mb-6 not-prose">
                            <AlertCircle className="h-8 w-8 text-destructive" />
                            <h2 className="text-3xl font-bold tracking-tight m-0">Troubleshooting</h2>
                        </div>
                        <div className="grid gap-8 not-prose">
                            <div className="p-6 rounded-xl border bg-muted/20">
                                <h3 className="font-bold text-lg mb-2">Hydration Mismatch Errors</h3>
                                <p className="text-sm text-muted-foreground">
                                    If you see errors regarding "Server/Client mismatch", ensure your system time is accurate.
                                    Odyssi uses client-side mounting for complex UI parts (like Settings) to prevent these issues.
                                </p>
                            </div>
                            <div className="p-6 rounded-xl border bg-muted/20">
                                <h3 className="font-bold text-lg mb-2">Missing Images in Docker</h3>
                                <p className="text-sm text-muted-foreground">
                                    Ensure that binary permissions are correct for the <code>public/uploads</code> directory.
                                    The application needs write access to this folder to store and serve your media.
                                </p>
                            </div>
                            <div className="p-6 rounded-xl border bg-muted/20">
                                <h3 className="font-bold text-lg mb-2">Default Admin Login</h3>
                                <p className="text-sm text-muted-foreground">
                                    The default user is <code>admin@odyssi.com</code> with password <code>odyssi</code>.
                                    If you cannot log in, verify that the initial seed ran correctly via <code>npx prisma db seed</code>.
                                </p>
                            </div>
                        </div>
                    </section>
                </main>
            </div>

            <footer className="border-t py-12 bg-muted/30">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-sm text-muted-foreground">© 2026 Odyssi. Open Source sanctuary for your memories.</p>
                </div>
            </footer>
        </div>
    )
}
