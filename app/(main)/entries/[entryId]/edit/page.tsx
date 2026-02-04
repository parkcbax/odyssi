import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { EntryEditor } from "@/components/entry-editor"

export default async function EditEntryPage({ params }: { params: Promise<{ entryId: string }> }) {
    const session = await auth()
    if (!session?.user?.id) return redirect("/login")

    const { entryId } = await params

    const entry = await prisma.entry.findUnique({
        where: {
            id: entryId,
            journal: { userId: session.user.id }
        },
        include: { tags: true }
    })

    if (!entry) notFound()

    const journals = await prisma.journal.findMany({
        where: { userId: session.user.id },
        select: { id: true, title: true, color: true }
    })

    return (
        <div className="max-w-4xl mx-auto h-full">
            <EntryEditor
                journals={journals}
                initialData={{
                    id: entry.id,
                    title: entry.title,
                    content: entry.content,
                    journalId: entry.journalId,
                    date: entry.date,
                    mood: entry.mood || undefined,
                    locationName: entry.locationName || undefined,
                    tags: entry.tags.map(t => t.name)
                }}
            />
        </div>
    )
}
