import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus, Users, LayoutGrid, List, Network } from "lucide-react"
import Link from "next/link"
import { ContactCard } from "@/components/relations/contact-card"
import { GroupCard } from "@/components/relations/group-card"
import { ContactFormDialog } from "@/components/relations/contact-form-dialog"
import { GroupFormDialog } from "@/components/relations/group-form-dialog"

export default async function RelationsPage() {
    const session = await auth()
    if (!session?.user?.id) return null
    const userId = session.user.id

    const contacts = await prisma.contact.findMany({
        where: { userId },
        include: { group: true },
        orderBy: { fullName: 'asc' }
    })

    const groups = await prisma.group.findMany({
        where: { userId },
        include: { _count: { select: { contacts: true } } },
        orderBy: { name: 'asc' }
    })

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Relation Manager</h1>
                    <p className="text-muted-foreground">Manage your personal CRM and networking tool.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/relations/network">
                        <Button variant="outline" className="gap-2">
                            <Network className="h-4 w-4" />
                            Network Visualizer
                        </Button>
                    </Link>
                    <GroupFormDialog userId={userId} groups={groups}>
                        <Button variant="outline" className="gap-2">
                            <Plus className="h-4 w-4" />
                            New Group
                        </Button>
                    </GroupFormDialog>
                    <ContactFormDialog userId={userId} groups={groups}>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            New Contact
                        </Button>
                    </ContactFormDialog>
                </div>
            </div>

            <Tabs defaultValue="contacts" className="w-full">
                <TabsList>
                    <TabsTrigger value="contacts" className="gap-2">
                        <Users className="h-4 w-4" />
                        Contacts
                    </TabsTrigger>
                    <TabsTrigger value="groups" className="gap-2">
                        <LayoutGrid className="h-4 w-4" />
                        Groups
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="contacts" className="mt-6">
                    {contacts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl opacity-60">
                            <Users className="h-12 w-12 mb-4" />
                            <h3 className="text-lg font-medium">No contacts yet</h3>
                            <p className="text-sm text-muted-foreground mb-4">Start by adding your first contact.</p>
                            <ContactFormDialog userId={userId} groups={groups}>
                                <Button>Add Contact</Button>
                            </ContactFormDialog>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {contacts.map(contact => (
                                <ContactCard key={contact.id} contact={contact} groups={groups} />
                            ))}
                        </div>
                    )}
                </TabsContent>
                <TabsContent value="groups" className="mt-6">
                    {groups.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl opacity-60">
                            <LayoutGrid className="h-12 w-12 mb-4" />
                            <h3 className="text-lg font-medium">No groups yet</h3>
                            <p className="text-sm text-muted-foreground mb-4">Organize your contacts into groups.</p>
                            <GroupFormDialog userId={userId} groups={groups}>
                                <Button>Add Group</Button>
                            </GroupFormDialog>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {groups.map(group => (
                                <GroupCard key={group.id} group={group} groups={groups} />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
