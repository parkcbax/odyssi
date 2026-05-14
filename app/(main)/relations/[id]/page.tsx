import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Phone, Calendar, User, Link2, Plus, MessageSquare, ExternalLink, RefreshCw, Trash2 } from "lucide-react"
import Link from "next/link"
import { ConnectionDialog } from "@/components/relations/connection-dialog"
import { format } from "date-fns"
import { deleteConnection, swapConnection } from "@/app/lib/relations-actions"

export default async function ContactProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) return null
    const userId = session.user.id

    const contact = await prisma.contact.findUnique({
        where: { id, userId },
        include: {
            group: true,
            entries: {
                orderBy: { date: 'desc' },
                take: 5
            },
            sourceConnections: {
                include: { targetContact: true }
            },
            targetConnections: {
                include: { sourceContact: true }
            }
        }
    })

    if (!contact) notFound()

    const allContacts = await prisma.contact.findMany({
        where: { userId, NOT: { id: contact.id } },
        orderBy: { fullName: 'asc' }
    })

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-10">
            <div className="flex flex-col md:flex-row gap-8 items-start">
                <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                    <AvatarImage src={contact.profilePicture || undefined} />
                    <AvatarFallback className="text-4xl"><User className="h-16 w-16" /></AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-4">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-bold">{contact.fullName}</h1>
                        <div className="flex flex-wrap gap-2 items-center">
                            {contact.group && <Badge variant="secondary" className="text-sm">{contact.group.name}</Badge>}
                            <span className="text-muted-foreground text-sm flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Added on {format(contact.createdAt, 'PP')}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm">
                        {contact.email && (
                            <a href={`mailto:${contact.email}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                                <Mail className="h-4 w-4" />
                                {contact.email}
                            </a>
                        )}
                        {contact.phoneNumber && (
                            <a href={`tel:${contact.phoneNumber}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                                <Phone className="h-4 w-4" />
                                {contact.phoneNumber}
                            </a>
                        )}
                    </div>

                    {contact.notes && (
                        <Card className="bg-muted/50 border-none">
                            <CardContent className="p-4 italic text-sm text-muted-foreground">
                                "{contact.notes}"
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <ConnectionDialog sourceContactId={contact.id} allContacts={allContacts}>
                        <Button className="gap-2">
                            <Link2 className="h-4 w-4" />
                            Add Connection
                        </Button>
                    </ConnectionDialog>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Connections Column */}
                <div className="md:col-span-1 space-y-6">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                        <NetworkIcon className="h-5 w-5" />
                        Connections
                    </h3>
                    <div className="space-y-3">
                        {[...contact.sourceConnections, ...contact.targetConnections].length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">No connections mapped yet.</p>
                        ) : (
                            <>
                                {contact.sourceConnections.map((conn) => (
                                    <ConnectionCard 
                                        key={conn.id} 
                                        targetName={conn.targetContact.fullName} 
                                        targetId={conn.targetContact.id}
                                        type={conn.connectionType}
                                        isSource={true}
                                        currentContactId={contact.id}
                                    />
                                ))}
                                {contact.targetConnections.map((conn) => (
                                    <ConnectionCard 
                                        key={conn.id} 
                                        targetName={conn.sourceContact.fullName} 
                                        targetId={conn.sourceContact.id}
                                        type={conn.connectionType}
                                        isSource={false}
                                        currentContactId={contact.id}
                                    />
                                ))}
                            </>
                        )}
                    </div>
                </div>

                {/* Entries Column */}
                <div className="md:col-span-2 space-y-6">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Mentioned In
                    </h3>
                    <div className="space-y-4">
                        {contact.entries.length === 0 ? (
                            <div className="text-center py-10 border rounded-lg bg-muted/20">
                                <p className="text-muted-foreground italic">No journal entries mention this contact yet.</p>
                                <Button variant="link" asChild>
                                    <Link href="/entries/new">Write a new entry</Link>
                                </Button>
                            </div>
                        ) : (
                            contact.entries.map((entry) => (
                                <Link key={entry.id} href={`/entries/${entry.id}`}>
                                    <Card className="hover:bg-accent transition-colors mb-3">
                                        <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                                            <div className="space-y-1">
                                                <CardTitle className="text-base">{entry.title}</CardTitle>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Calendar className="h-3 w-3" />
                                                    {format(new Date(entry.date), 'PPPP')}
                                                </div>
                                            </div>
                                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                    </Card>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function ConnectionCard({ targetName, targetId, type, isSource, currentContactId }: { targetName: string, targetId: string, type: string, isSource: boolean, currentContactId: string }) {
    const sourceId = isSource ? currentContactId : targetId
    const destId = isSource ? targetId : currentContactId

    return (
        <Card className="bg-card/50 group">
            <CardContent className="p-3 flex items-center justify-between text-sm">
                <div className="flex flex-col">
                    <Link href={`/relations/${targetId}`} className="font-medium hover:underline">
                        {targetName}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                        {isSource ? `is ${type}` : `(linked as: ${type})`}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <form action={swapConnection}>
                        <input type="hidden" name="sourceContactId" value={sourceId} />
                        <input type="hidden" name="targetContactId" value={destId} />
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Swap Direction"
                            className="h-8 w-8 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </form>
                    <form action={deleteConnection}>
                        <input type="hidden" name="sourceContactId" value={sourceId} />
                        <input type="hidden" name="targetContactId" value={destId} />
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Delete Connection"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </form>
                    <Link2 className="h-4 w-4 text-muted-foreground opacity-30" />
                </div>
            </CardContent>
        </Card>
    )
}

function NetworkIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect x="16" y="16" width="6" height="6" rx="1" />
            <rect x="2" y="16" width="6" height="6" rx="1" />
            <rect x="9" y="2" width="6" height="6" rx="1" />
            <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
            <path d="M12 12V8" />
        </svg>
    )
}
