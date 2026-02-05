import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { EntryEditor } from "@/components/entry-editor"

export default async function NewEntryPage() {
    const session = await auth()
    if (!session?.user?.id) return redirect("/login")

    // Fetch journals for the selector
    const journals = await prisma.journal.findMany({
        where: { userId: session.user.id },
        select: { id: true, title: true, color: true, isDefault: true },
        orderBy: [
            { isDefault: 'desc' },
            { createdAt: 'desc' }
        ]
    })

    if (journals.length === 0) {
        // Handle case where user has no journals? 
        // Ideally prompt to create one or create a default "My Journal"
        // For now, let's redirect to create journal or just show empty
        return redirect("/journals") // Force them to create a journal first
    }

    return (
        <div className="max-w-4xl mx-auto h-full">
            <EntryEditor journals={journals} />
        </div>
    )
}
