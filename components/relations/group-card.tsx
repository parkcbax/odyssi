"use client"

import { Group } from "@prisma/client"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { deleteGroup } from "@/app/lib/relations-actions"
import { toast } from "sonner"
import { GroupFormDialog } from "./group-form-dialog"

interface GroupCardProps {
    group: any // include _count
}

export function GroupCard({ group }: GroupCardProps) {
    const handleDelete = async () => {
        if (confirm(`Are you sure you want to delete ${group.name}? This will remove all contacts from this group (but not delete them).`)) {
            const result = await deleteGroup(group.id)
            if (result.message === "Success") {
                toast.success("Group deleted")
            } else {
                toast.error("Failed to delete group")
            }
        }
    }

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                <div className="flex flex-col">
                    <h3 className="font-semibold text-lg">{group.name}</h3>
                    <p className="text-xs text-muted-foreground">{group._count.contacts} contacts</p>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <GroupFormDialog userId={group.userId} group={group}>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Edit</DropdownMenuItem>
                        </GroupFormDialog>
                        <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                {group.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {group.description}
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
