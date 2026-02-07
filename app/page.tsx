import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, Book, Lock, Sparkles, Trash2, Archive } from "lucide-react"
import { getAppConfig } from "@/app/lib/actions"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"

// Helper to extract text from Tiptap JSON
function getExcerpt(content: any): string {
  if (!content) return ""

  // If content is string, try to parse it as JSON first (Tiptap content might be stored as stringified JSON)
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content)
      // If successful, treat it as object
      return getExcerpt(parsed)
    } catch {
      // If not valid JSON, treat as plain text
      return content.substring(0, 150) + (content.length > 150 ? "..." : "")
    }
  }

  // Handle legacy format { type: "markdown", text: "..." }
  if (content.text && typeof content.text === 'string' && content.type === 'markdown') {
    try {
      const nested = JSON.parse(content.text)
      if (nested && nested.type === 'doc') {
        return getExcerpt(nested)
      }
    } catch {
      // Not JSON, continue to return raw text
    }
    return content.text.substring(0, 150) + (content.text.length > 150 ? "..." : "")
  }

  // Handle Tiptap JSON
  try {
    let text = ""
    const traverse = (node: any) => {
      if (node.type === 'text' && typeof node.text === 'string') {
        text += node.text
      }

      const isBlock = ['paragraph', 'heading', 'blockquote', 'bulletList', 'orderedList', 'listItem'].includes(node.type)

      if (node.content && Array.isArray(node.content)) {
        node.content.forEach(traverse)
      }

      if (isBlock) {
        text += " "
      }
    }

    // Tiptap doc usually starts with type: 'doc'
    if (content.type === 'doc' || Array.isArray(content.content)) {
      traverse(content)
      // Clean up multiple spaces
      const cleanText = text.replace(/\s+/g, ' ').trim()
      return cleanText.substring(0, 150) + (cleanText.length > 150 ? "..." : "")
    }
  } catch (e) {
    console.error("Excerpt generation error", e)
    return ""
  }

  return ""
}

export default async function Home() {
  const [session, config] = await Promise.all([
    auth(),
    getAppConfig()
  ])

  if (config.redirectHomeToLogin && !session) {
    redirect("/login")
  }

  if (session) {
    redirect("/dashboard")
  }

  // Fetch blog posts if enabled
  const recentPosts = config.enableBlogging
    ? await prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: { author: { select: { name: true } } }
    })
    : []

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <Link className="flex items-center justify-center gap-2 font-bold text-xl" href="#">
          <div className="relative h-8 w-8">
            <Image src="/assets/odyssi_logo.png" alt="Odyssi Logo" fill className="object-contain" />
          </div>
          <span>Odyssi</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          {config.enableBlogging && (
            <Link className="text-sm font-medium hover:underline underline-offset-4" href="#blog">
              Blog
            </Link>
          )}
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/login">
            Sign In
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="relative w-full py-20 md:py-32 lg:py-48 overflow-hidden bg-background">
          {/* Aurora Background Elements */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute top-[10%] -right-[5%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px] animate-pulse [animation-duration:8s]" />
            <div className="absolute -bottom-[10%] left-[10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse [animation-duration:12s]" />
          </div>

          {/* Subtle Grid Pattern */}
          <div className="absolute inset-0 z-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, var(--border) 1px, transparent 0)`,
              backgroundSize: '40px 40px'
            }} />

          <div className="container relative z-10 px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-8 text-center">
              <div className="space-y-4 max-w-[900px] animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out">
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl/none lg:leading-[1.1]">
                  Your Thoughts, <span className="text-primary relative inline-block whitespace-nowrap">
                    Unbound
                    <span className="absolute -bottom-2 left-0 w-full h-1.5 bg-primary/30 rounded-full" />
                  </span>.
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-2xl/relaxed font-medium">
                  A minimalist, self-hosted sanctuary for your memories. Private, secure, and beautiful.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300 fill-mode-both">
                <Link href="/login">
                  <Button size="lg" className="h-14 px-8 text-lg font-semibold gap-2 shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-1 active:scale-95">
                    Start Writing <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="https://github.com/parkcbax/odyssi" target="_blank">
                  <Button variant="outline" size="lg" className="h-14 px-8 text-lg font-medium transition-all hover:bg-muted/50 active:scale-95 backdrop-blur-sm bg-background/30 border-2">
                    GitHub
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {config.enableBlogging && recentPosts.length > 0 && (
          <section id="blog" className="w-full py-12 md:py-24 lg:py-32 bg-muted/30">
            <div className="container px-4 md:px-6 mx-auto">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-5xl/none mb-8 text-center">
                Latest from the <span className="text-primary">Blog</span>
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {recentPosts.map((post: any) => (
                  <Link key={post.id} href={`/blog/${post.slug}`} className="group">
                    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-background hover:shadow-lg transition-shadow">
                      <div className="p-6 flex-1">
                        <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{post.title}</h3>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                          {getExcerpt(post.content)}
                        </p>
                      </div>
                      <div className="p-6 pt-0 text-xs text-muted-foreground">
                        {new Date(post.createdAt).toLocaleDateString()} • {post.author.name}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="w-full py-24 md:py-32 bg-secondary/10">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center space-y-4 mb-16 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Built for your <span className="text-primary">Digital Wellbeing</span>
              </h2>
              <p className="text-muted-foreground md:text-xl max-w-[800px] mx-auto">
                Odyssi combines modern design with ultimate privacy, giving you a beautiful sanctuary for your thoughts.
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Private & Secure",
                  description: "Your data lives on your server. No tracking, no ads, just your words in your control.",
                  icon: <Lock className="h-6 w-6" />,
                  color: "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                },
                {
                  title: "Rich Text Editor",
                  description: "Write beautiful entries with Tiptap editor support, handling everything from images to checklist.",
                  icon: <Sparkles className="h-6 w-6" />,
                  color: "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                },
                {
                  title: "Visual Calendar",
                  description: "Relive memories through a beautiful calendar view featuring thumbnail previews of your media.",
                  icon: <div className="h-6 w-6 flex items-center justify-center font-bold">📅</div>,
                  color: "bg-green-500/10 text-green-600 dark:text-green-400"
                },
                {
                  title: "Blogging Platform",
                  description: "Share your selected entries with the world through a built-in, customizable blogging engine.",
                  icon: <Book className="h-6 w-6" />,
                  color: "bg-primary/10 text-primary"
                },
                {
                  title: "Media Cleanup",
                  description: "Keep your storage clean with intelligent scanning that identifies and removes unreferenced files.",
                  icon: <Trash2 className="h-6 w-6" />,
                  color: "bg-destructive/10 text-destructive"
                },
                {
                  title: "Backup & Restore",
                  description: "Never lose a memory. Securely export and import your entire library with single-click archives.",
                  icon: <Archive className="h-6 w-6" />,
                  color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                }
              ].map((feature, idx) => (
                <div
                  key={idx}
                  className="group relative flex flex-col p-8 rounded-2xl border bg-background/50 backdrop-blur-sm transition-all hover:shadow-xl hover:-translate-y-1 duration-300"
                >
                  <div className={cn(
                    "mb-6 p-3 rounded-xl w-fit transition-transform group-hover:scale-110 duration-300",
                    feature.color
                  )}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none">
                    <Sparkles className="h-16 w-16" />
                  </div>
                </div>
              ))}
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
