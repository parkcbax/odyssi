"use client"

import { Contact, Group } from "@prisma/client"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Mail, Phone, ExternalLink, User } from "lucide-react"
import Link from "next/link"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { deleteContact, deleteGroup } from "@/app/lib/relations-actions"
import { toast } from "sonner"
import { ContactFormDialog } from "./contact-form-dialog"
import { GroupFormDialog } from "./group-form-dialog"

interface ContactCardProps {
    contact: any // include group
    groups: Group[]
}

export function ContactCard({ contact, groups }: ContactCardProps) {
    const handleDelete = async () => {
        if (confirm(`Are you sure you want to delete ${contact.fullName}?`)) {
            const result = await deleteContact(contact.id)
            if (result.message === "Success") {
                toast.success("Contact deleted")
            } else {
                toast.error("Failed to delete contact")
            }
        }
    }

    return (
        <Card className="overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={contact.profilePicture || undefined} />
                        <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <Link href={`/relations/${contact.id}`} className="font-semibold hover:underline">
                            {contact.fullName}
                        </Link>
                        {contact.group && (
                            <Badge variant="secondary" className="w-fit text-[10px] py-0 h-4 mt-0.5">
                                {contact.group.name}
                            </Badge>
                        )}
                    </div>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link href={`/relations/${contact.id}`}>View Profile</Link>
                        </DropdownMenuItem>
                        <ContactFormDialog userId={contact.userId} groups={groups} contact={contact}>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Edit</DropdownMenuItem>
                        </ContactFormDialog>
                        <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
                {contact.email && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{contact.email}</span>
                    </div>
                )}
                {contact.phoneNumber && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{contact.phoneNumber}</span>
                    </div>
                )}
                {contact.notes && (
                    <p className="text-xs text-muted-foreground line-clamp-2 pt-1 border-t italic">
                        {contact.notes}
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
