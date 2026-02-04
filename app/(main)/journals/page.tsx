import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { CreateJournalDialog } from "@/components/create-journal-dialog"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Book } from "lucide-react"

export default async function JournalsPage() {
    const session = await auth()
    if (!session?.user?.id) return redirect("/login")

    const journals = await prisma.journal.findMany({
        where: { userId: session.user.id },
        orderBy: { updatedAt: 'desc' }
    })

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Journals</h1>
                <CreateJournalDialog />
            </div>
            {journals.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border bg-muted/50 border-dashed text-muted-foreground p-8 text-center min-h-[300px]">
                    <div className="p-4 bg-background rounded-full mb-4">
                        <Book className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-lg font-medium">No journals yet</h3>
                    <p className="text-sm text-muted-foreground mt-2 mb-4 max-w-sm">
                        Create your first journal to start documenting your journey.
                    </p>
                    <CreateJournalDialog />
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {journals.map((journal) => (
                        <Link key={journal.id} href={`/journals/${journal.id}`}>
                            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                                <CardHeader>
                                    <CardTitle>{journal.title}</CardTitle>
                                    <CardDescription className="line-clamp-2">{journal.description || "No description"}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-xs text-muted-foreground">
                                        Last updated: {new Date(journal.updatedAt).toLocaleDateString()}
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
