import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { BlogEditor } from "@/components/blog/blog-editor"

export default async function EditBlogPostPage({ params }: { params: { slug: string } }) {
    const session = await auth()
    if (!session?.user?.id) redirect("/login")

    const { slug } = await params

    const post = await prisma.blogPost.findUnique({
        where: { slug: slug, authorId: session.user.id }
    })

    if (!post) notFound()

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold mb-8">Edit Blog Post</h1>
            <BlogEditor initialData={post} />
        </div>
    )
}
