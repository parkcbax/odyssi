import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { BlogRenderer } from "@/components/blog/blog-renderer"

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
    const { slug } = await params
    const post = await prisma.blogPost.findUnique({
        where: { slug: slug },
        include: { author: { select: { name: true } } }
    })

    if (!post) return notFound()

    return (
        <article className="max-w-3xl mx-auto py-10 space-y-8">
            <header className="space-y-4 text-center">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">{post.title}</h1>
                <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                    <time dateTime={post.createdAt.toISOString()}>
                        {new Date(post.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </time>
                    <span>•</span>
                    <span>{post.author.name}</span>
                </div>
            </header>

            <div className="mx-auto">
                <BlogRenderer content={post.content} />
            </div>
        </article>
    )
}
