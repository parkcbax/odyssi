import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { BlogRenderer } from "@/components/blog/blog-renderer"
import { Metadata } from "next"

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const { slug } = await params
    const post = await prisma.blogPost.findUnique({
        where: { slug },
        select: { title: true, excerpt: true, featuredImage: true }
    })

    if (!post) {
        return {
            title: "Post Not Found",
            description: "The requested blog post could not be found."
        }
    }

    const baseUrl = process.env.NEXTAUTH_URL || "https://odys.si"
    const ogImage = post.featuredImage
        ? (post.featuredImage.startsWith('http') ? post.featuredImage : `${baseUrl}${post.featuredImage}`)
        : undefined

    return {
        title: post.title,
        description: post.excerpt,
        openGraph: {
            title: post.title,
            description: post.excerpt || undefined,
            url: `${baseUrl}/blog/${slug}`,
            type: "article",
            images: ogImage ? [{ url: ogImage }] : undefined,
        },
        twitter: {
            card: "summary_large_image",
            title: post.title,
            description: post.excerpt || undefined,
            images: ogImage ? [ogImage] : undefined,
        }
    }
}

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
