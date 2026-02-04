import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, ArrowRight } from "lucide-react"

export default async function BlogPage() {
    const session = await auth()

    // Show ALL published posts for public view
    // If user is author, maybe show drafts too? For now, just public posts.
    const posts = await prisma.blogPost.findMany({
        where: { published: true },
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { name: true } } }
    })

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Blog</h1>
                    <p className="text-muted-foreground">Stories and updates from Odyssi.</p>
                </div>
                {session && (
                    <Button asChild>
                        <Link href="/blog/new">
                            <Plus className="h-4 w-4 mr-2" />
                            New Post
                        </Link>
                    </Button>
                )}
            </div>

            <div className="grid gap-6">
                {posts.length === 0 ? (
                    <div className="text-center py-10 border rounded-lg bg-muted/40 text-muted-foreground">
                        No blog posts found.
                    </div>
                ) : (
                    posts.map(post => (
                        <div key={post.id} className="p-6 border rounded-lg hover:shadow-lg transition-shadow bg-card">
                            <div className="flex flex-col gap-2">
                                <h2 className="text-2xl font-bold hover:text-primary transition-colors">
                                    <Link href={`/blog/${post.slug}`}>
                                        {post.title}
                                    </Link>
                                </h2>
                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span>{post.author.name}</span>
                                </div>
                                <div className="mt-4">
                                    <Button variant="link" className="p-0 h-auto" asChild>
                                        <Link href={`/blog/${post.slug}`}>Read more <ArrowRight className="ml-1 h-3 w-3" /></Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
