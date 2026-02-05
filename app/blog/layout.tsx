import Link from "next/link"
import Image from "next/image"

import { auth } from "@/auth"

export default async function BlogLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    return (
        <div className="flex flex-col min-h-screen">
            <header className="px-4 lg:px-6 h-14 flex items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
                <Link className="flex items-center justify-center gap-2 font-bold text-xl" href="/">
                    <div className="relative h-8 w-8">
                        <Image src="/assets/odyssi_logo.png" alt="Odyssi Logo" fill className="object-contain" />
                    </div>
                    <span>Odyssi</span>
                </Link>
                <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
                    <Link className="text-sm font-medium hover:underline underline-offset-4" href="/blog">
                        All Posts
                    </Link>
                    {session ? (
                        <Link href="/dashboard" className="text-sm font-medium hover:underline underline-offset-4">
                            Dashboard
                        </Link>
                    ) : (
                        <Link className="text-sm font-medium hover:underline underline-offset-4" href="/login">
                            Sign In
                        </Link>
                    )}
                </nav>
            </header>
            <main className="flex-1 container mx-auto py-8 md:py-12">
                {children}
            </main>
            <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
                <p className="text-xs text-muted-foreground">© 2026 Odyssi. Open Source.</p>
                <nav className="sm:ml-auto flex gap-4 sm:gap-6">
                    <Link className="text-xs hover:underline underline-offset-4" href="#">
                        Terms of Service
                    </Link>
                    <Link className="text-xs hover:underline underline-offset-4" href="#">
                        Privacy
                    </Link>
                </nav>
            </footer>
        </div>
    )
}
