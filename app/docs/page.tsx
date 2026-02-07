import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { Book, Download, RotateCcw, Shield, Terminal, Settings, AlertCircle, Trash2, Archive, Globe, Sparkles } from "lucide-react"

export default function DocsPage() {
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

            <div className="container mx-auto px-4 md:px-6 flex-1 lg:grid lg:grid-cols-[240px_1fr] lg:gap-10 py-8 lg:py-12">
                <aside className="sticky top-20 h-[calc(100vh-120px)] overflow-y-auto hidden lg:block pr-4 custom-scrollbar">
                    <div className="space-y-6">
                        <div>
                            <h4 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground/70">Getting Started</h4>
                            <div className="grid grid-flow-row auto-rows-max text-sm space-y-1">
                                <a href="#introduction" className="flex w-full items-center rounded-md p-2 hover:bg-muted font-medium">Introduction</a>
                                <a href="#installation-local" className="flex w-full items-center rounded-md p-2 hover:bg-muted font-medium">Local Setup</a>
                                <a href="#installation-docker" className="flex w-full items-center rounded-md p-2 hover:bg-muted font-medium">Docker Setup</a>
                            </div>
                        </div>
                        <div>
                            <h4 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground/70">Features</h4>
                            <div className="grid grid-flow-row auto-rows-max text-sm space-y-1">
                                <a href="#backup-restore" className="flex w-full items-center rounded-md p-2 hover:bg-muted font-medium">Backup & Restore</a>
                                <a href="#media-cleanup" className="flex w-full items-center rounded-md p-2 hover:bg-muted font-medium">Media Cleanup</a>
                                <a href="#public-sharing" className="flex w-full items-center rounded-md p-2 hover:bg-muted font-medium">Public Sharing</a>
                            </div>
                        </div>
                        <div>
                            <h4 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground/70">Help</h4>
                            <div className="grid grid-flow-row auto-rows-max text-sm space-y-1">
                                <a href="#troubleshooting" className="flex w-full items-center rounded-md p-2 hover:bg-muted font-medium">Troubleshooting</a>
                            </div>
                        </div>
                    </div>
                </aside>

                <main className="prose prose-neutral dark:prose-invert max-w-none">
                    <section id="introduction" className="scroll-m-20">
                        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">Introduction</h1>
                        <p className="text-xl text-muted-foreground leading-relaxed">
                            Odyssi is a modern, minimalist, and self-hosted sanctuary for your thoughts.
                            It focuses on privacy, beauty, and data ownership, allowing you to journal without distraction
                            or fear of third-party tracking.
                        </p>
                        <div className="grid sm:grid-cols-2 gap-4 mt-8 not-prose">
                            <div className="p-6 rounded-xl border bg-muted/30">
                                <Shield className="h-8 w-8 text-primary mb-3" />
                                <h3 className="font-bold mb-1">Privacy First</h3>
                                <p className="text-sm text-muted-foreground">Everything is hosted on your own hardware. You own 100% of your data.</p>
                            </div>
                            <div className="p-6 rounded-xl border bg-muted/30">
                                <Sparkles className="h-8 w-8 text-primary mb-3" />
                                <h3 className="font-bold mb-1">Modern UI</h3>
                                <p className="text-sm text-muted-foreground">Built with React, Next.js, and Tailwind CSS for a fast, responsive experience.</p>
                            </div>
                        </div>
                    </section>

                    <Separator className="my-12" />

                    <section id="installation-local" className="scroll-m-20">
                        <h2 className="text-3xl font-bold tracking-tight border-b pb-2 mb-6">Local Installation</h2>
                        <p>To run Odyssi locally for development or manual hosting, follow these steps:</p>
                        <ol className="mt-4 space-y-4">
                            <li>
                                <strong>Clone the repo:</strong>
                                <pre className="bg-muted p-4 rounded-lg mt-2 overflow-x-auto text-sm">git clone https://github.com/parkcbax/odyssi.git</pre>
                            </li>
                            <li>
                                <strong>Install dependencies:</strong>
                                <pre className="bg-muted p-4 rounded-lg mt-2 overflow-x-auto text-sm">npm install</pre>
                            </li>
                            <li>
                                <strong>Configure Environment:</strong>
                                <p className="text-sm text-muted-foreground mt-2">Create a <code>.env</code> file based on <code>.env.example</code>. You must provide a <code>DATABASE_URL</code> and <code>NEXTAUTH_SECRET</code>.</p>
                            </li>
                            <li>
                                <strong>Run Migrations & Seed:</strong>
                                <pre className="bg-muted p-4 rounded-lg mt-2 overflow-x-auto text-sm">npx prisma migrate dev{"\n"}npx prisma db seed</pre>
                            </li>
                            <li>
                                <strong>Start Dev Server:</strong>
                                <pre className="bg-muted p-4 rounded-lg mt-2 overflow-x-auto text-sm">npm run dev</pre>
                            </li>
                        </ol>
                    </section>

                    <Separator className="my-12" />

                    <section id="installation-docker" className="scroll-m-20">
                        <h2 className="text-3xl font-bold tracking-tight border-b pb-2 mb-6">Docker Installation</h2>
                        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 mb-6">
                            <p className="text-sm m-0"><strong>Tip:</strong> Docker is the recommended way to host Odyssi in production (e.g., on a NAS or VPS).</p>
                        </div>
                        <p>Use the provided <code>docker-compose.yml</code> to get up and running quickly:</p>
                        <pre className="bg-muted p-4 rounded-lg mt-4 overflow-x-auto text-sm"># Build and start the containers{"\n"}docker-compose up -d --build</pre>
                        <p className="mt-4">This will start both the Next.js application and a PostgreSQL database. The application will be accessible at <code>http://localhost:3000</code>.</p>
                    </section>

                    <Separator className="my-12" />

                    <section id="backup-restore" className="scroll-m-20">
                        <div className="flex items-center gap-2 mb-6">
                            <Archive className="h-8 w-8 text-primary" />
                            <h2 className="text-3xl font-bold tracking-tight m-0">Backup & Restore</h2>
                        </div>
                        <p>Protecting your memories is critical. Odyssi provides built-in tools for manual and automatic backups.</p>

                        <h3 className="text-xl font-bold mt-8">Manual Backup</h3>
                        <p>Navigate to <strong>Settings &gt; Backup</strong>. You can choose to export a single journal or your entire library, including all images and settings. The result is a secure ZIP archive.</p>

                        <h3 className="text-xl font-bold mt-8">Automatic Backups</h3>
                        <p>Enable automatic backups in the settings to have Odyssi periodically generate archives without manual intervention.</p>

                        <h3 className="text-xl font-bold mt-8">Restoring</h3>
                        <p>Navigate to <strong>Settings &gt; Restore</strong> and upload one of your previously exported ZIP archives. Odyssi will overwrite existing entries and media if conflicts occur.</p>
                    </section>

                    <Separator className="my-12" />

                    <section id="media-cleanup" className="scroll-m-20">
                        <div className="flex items-center gap-2 mb-6">
                            <Trash2 className="h-8 w-8 text-primary" />
                            <h2 className="text-3xl font-bold tracking-tight m-0">Media Cleanup</h2>
                        </div>
                        <p>Over time, you might upload images that are no longer used in any entries (orphaned files). Odyssi includes an intelligent cleanup tool.</p>
                        <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20 my-6">
                            <p className="text-sm m-0"><strong>Safety Note:</strong> Files aren't deleted immediately. They are moved to a <code>trash</code> folder for manual review.</p>
                        </div>
                        <p>Running the cleanup will provide a <strong>Media Index Report</strong>, showing exactly where each file is referenced or if it has been moved to trash.</p>
                    </section>

                    <Separator className="my-12" />

                    <section id="public-sharing" className="scroll-m-20">
                        <div className="flex items-center gap-2 mb-6">
                            <Globe className="h-8 w-8 text-primary" />
                            <h2 className="text-3xl font-bold tracking-tight m-0">Public Sharing</h2>
                        </div>
                        <p>While Odyssi is private, you can choose to share specific entries or blog posts with the world.</p>
                        <ul className="mt-4 space-y-2">
                            <li><strong>Public Slugs:</strong> Create custom URLs for your shared entries.</li>
                            <li><strong>Auto-Expiration:</strong> Set links to expire automatically after a certain time.</li>
                            <li><strong>Blog Feature:</strong> Enable the blog to create a continuous public record of your journey.</li>
                        </ul>
                    </section>

                    <Separator className="my-12" />

                    <section id="troubleshooting" className="scroll-m-20 pb-24">
                        <div className="flex items-center gap-2 mb-6">
                            <AlertCircle className="h-8 w-8 text-destructive" />
                            <h2 className="text-3xl font-bold tracking-tight m-0">Troubleshooting</h2>
                        </div>
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-lg font-bold">Hydration Mismatch Errors</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    If you see errors regarding "Server/Client mismatch", ensure your system time is accurate.
                                    Odyssi uses client-side mounting for complex UI parts (like Settings) to prevent these issues.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">Missing Images in Docker</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Ensure that binary permissions are correct for the <code>public/uploads</code> directory.
                                    The application needs write access to this folder to store and serve your media.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">Default Admin Login</h3>
                                <p className="text-sm text-muted-foreground mt-1">
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
