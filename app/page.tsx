import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Book, Lock, Sparkles } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <Link className="flex items-center justify-center gap-2 font-bold text-xl" href="#">
          <Book className="h-6 w-6 text-primary" />
          <span>Odyssi</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/login">
            Sign In
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-background">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Your Thoughts, <span className="text-primary">Unbound</span>.
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  A minimalist, self-hosted sanctuary for your memories. Private, secure, and beautiful.
                </p>
              </div>
              <div className="space-x-4">
                <Link href="/login">
                  <Button size="lg" className="gap-2">
                    Start Writing <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="https://github.com/your-repo/odyssi" target="_blank">
                  <Button variant="outline" size="lg">
                    GitHub
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-secondary/20">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-center space-y-2 border-border p-4 rounded-lg">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Private & Secure</h2>
                <p className="text-center text-muted-foreground">
                  Your data lives on your server. No tracking, no ads, just your words.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 border-border p-4 rounded-lg">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Daily Inspiration</h2>
                <p className="text-center text-muted-foreground">
                  Thought-provoking prompts and "On This Day" reflections to keep you writing.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 border-border p-4 rounded-lg">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Book className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Organized Journals</h2>
                <p className="text-center text-muted-foreground">
                  Create multiple journals for different aspects of your life.
                </p>
              </div>
            </div>
          </div>
        </section>
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
