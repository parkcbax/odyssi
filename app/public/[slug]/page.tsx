import { getPublicEntry } from "@/app/lib/actions-share"
import { notFound } from "next/navigation"
import { EntryViewer } from "@/components/entry-viewer"
import { PublicEntryPasswordForm } from "@/components/public-entry-password-form"
import { cookies } from "next/headers"
import { Calendar, MapPin, Tag } from "lucide-react"

export default async function PublicEntryPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const entry = await getPublicEntry(slug)

    if (!entry) {
        notFound()
    }

    // Password Check
    if (entry.publicPassword) {
        const cookieStore = await cookies()
        // We use the simple name we decided on in the client form
        const authCookie = cookieStore.get(`access-${slug}`)

        if (authCookie?.value !== entry.publicPassword) {
            return <PublicEntryPasswordForm slug={slug} />
        }
    }

    return (
        <main className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">

                {/* Minimal Header */}
                <header className="mb-12 border-b pb-6">
                    <h1 className="text-4xl font-bold tracking-tight mb-4">{entry.title}</h1>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                        {entry.locationName && (
                            <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {entry.locationName}
                            </div>
                        )}
                        {entry.tags.length > 0 && (
                            <div className="flex items-center gap-1">
                                <Tag className="h-4 w-4" />
                                <div className="flex gap-1">
                                    {entry.tags.map(tag => (
                                        <span key={tag.id} className="bg-muted px-1.5 py-0.5 rounded-md text-xs">
                                            {tag.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                {/* Content */}
                <article className="prose prose-lg dark:prose-invert max-w-none">
                    {entry.content ? (
                        <EntryViewer content={entry.content} />
                    ) : (
                        <p className="text-muted-foreground italic">No content.</p>
                    )}
                </article>

                {/* Simple Footer */}
                <footer className="mt-16 pt-8 border-t text-center text-sm text-muted-foreground">
                    <p>Published via <a href="https://odys.si" target="_blank" rel="noopener noreferrer" className="hover:underline underline-offset-4">Odyssi</a></p>
                </footer>
            </div>
        </main>
    )
}
