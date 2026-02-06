import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, Trash2, Edit, ExternalLink } from "lucide-react"
import { deleteBlogPost } from "@/app/lib/actions"

export const dynamic = 'force-dynamic'

export default async function DashboardBlogPage() {
    const session = await auth()
    if (!session?.user?.id) return null

    const posts = await prisma.blogPost.findMany({
        where: { authorId: session.user.id },
        orderBy: { createdAt: 'desc' },
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Blog Management</h1>
                    <p className="text-muted-foreground">Manage your blog posts.</p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/blog/new">
                        <Plus className="h-4 w-4 mr-2" />
                        New Post
                    </Link>
                </Button>
            </div>

            <div className="border rounded-lg bg-card text-card-foreground shadow-sm">
                <div className="p-6">
                    {posts.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            No blog posts yet. Start writing!
                        </div>
                    ) : (
                        <div className="divide-y">
                            {posts.map(post => (
                                <div key={post.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h3 className="font-semibold text-lg">{post.title}</h3>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${post.published ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'}`}>
                                                {post.published ? 'Published' : 'Draft'}
                                            </span>
                                            <span>•</span>
                                            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/blog/${post.slug}`} target="_blank">
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                View
                                            </Link>
                                        </Button>
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/dashboard/blog/edit/${post.slug}`}>
                                                <Edit className="h-4 w-4 mr-2" />
                                                Edit
                                            </Link>
                                        </Button>
                                        <form action={async () => {
                                            'use server'
                                            await deleteBlogPost(post.id)
                                        }}>
                                            <Button variant="destructive" size="sm" type="submit">
                                                <Trash2 className="h-4 w-4" />
                                                <span className="sr-only">Delete</span>
                                            </Button>
                                        </form>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
