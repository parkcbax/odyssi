import { BlogEditor } from "@/components/blog/blog-editor"

export default function NewBlogPostPage() {
    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold mb-8">New Blog Post</h1>
            <BlogEditor />
        </div>
    )
}
