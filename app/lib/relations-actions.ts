'use server'

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

const ContactSchema = z.object({
    id: z.string().optional(),
    fullName: z.string().min(1, "Full name is required"),
    email: z.string().email().optional().or(z.literal("")),
    phoneNumber: z.string().optional(),
    notes: z.string().optional(),
    groupId: z.string().optional().nullable(),
    profilePicture: z.string().optional(),
})

export async function upsertContact(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) return { message: "Unauthorized" }
    const userId = session.user.id

    const validatedFields = ContactSchema.safeParse({
        id: formData.get("id"),
        fullName: formData.get("fullName"),
        email: formData.get("email"),
        phoneNumber: formData.get("phoneNumber"),
        notes: formData.get("notes"),
        groupId: formData.get("groupId") === "none" ? null : formData.get("groupId"),
        profilePicture: formData.get("profilePicture"),
    })

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors, message: "Invalid fields" }
    }

    const { id, ...data } = validatedFields.data

    try {
        if (id) {
            await prisma.contact.update({
                where: { id, userId },
                data: {
                    ...data,
                    groupId: data.groupId || null
                }
            })
        } else {
            await prisma.contact.create({
                data: {
                    ...data,
                    userId,
                    groupId: data.groupId || null
                }
            })
        }
    } catch (error) {
        console.error("Failed to upsert contact:", error)
        return { message: "Database Error" }
    }

    revalidatePath("/relations")
    return { message: "Success" }
}

export async function deleteContact(id: string) {
    const session = await auth()
    if (!session?.user?.id) return { message: "Unauthorized" }

    try {
        await prisma.contact.delete({
            where: { id, userId: session.user.id }
        })
    } catch (error) {
        console.error("Failed to delete contact:", error)
        return { message: "Database Error" }
    }

    revalidatePath("/relations")
    return { message: "Success" }
}

const GroupSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Group name is required"),
    description: z.string().optional(),
})

export async function upsertGroup(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) return { message: "Unauthorized" }
    const userId = session.user.id

    console.log("Raw Form Data - name:", formData.get("name"), "description:", formData.get("description"))

    const validatedFields = GroupSchema.safeParse({
        id: formData.get("id"),
        name: formData.get("name"),
        description: formData.get("description"),
    })

    console.log("Upserting Group. Validated Fields:", validatedFields.success ? "Success" : "Failed", validatedFields.data)

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors, message: "Invalid fields" }
    }

    const { id, ...data } = validatedFields.data

    try {
        if (id) {
            await prisma.group.update({
                where: { id, userId },
                data
            })
        } else {
            await prisma.group.create({
                data: {
                    ...data,
                    userId
                }
            })
        }
        console.log("Group upserted successfully")
    } catch (error) {
        console.error("Failed to upsert group:", error)
        return { message: "Database Error" }
    }

    revalidatePath("/relations")
    return { message: "Success" }
}

export async function deleteGroup(id: string) {
    const session = await auth()
    if (!session?.user?.id) return { message: "Unauthorized" }

    try {
        await prisma.group.delete({
            where: { id, userId: session.user.id }
        })
    } catch (error) {
        console.error("Failed to delete group:", error)
        return { message: "Database Error" }
    }

    revalidatePath("/relations")
    return { message: "Success" }
}

const ConnectionSchema = z.object({
    sourceContactId: z.string().min(1),
    targetContactId: z.string().min(1),
    connectionType: z.string().min(1),
})

export async function createConnection(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) return { message: "Unauthorized" }
    const userId = session.user.id

    const validatedFields = ConnectionSchema.safeParse({
        sourceContactId: formData.get("sourceContactId"),
        targetContactId: formData.get("targetContactId"),
        connectionType: formData.get("connectionType"),
    })

    if (!validatedFields.success) {
        return { message: "Invalid fields" }
    }

    const { sourceContactId, targetContactId, connectionType } = validatedFields.data

    if (sourceContactId === targetContactId) {
        return { message: "Cannot connect a contact to themselves" }
    }

    try {
        await prisma.connection.upsert({
            where: {
                sourceContactId_targetContactId: {
                    sourceContactId,
                    targetContactId
                }
            },
            update: { connectionType },
            create: {
                userId,
                sourceContactId,
                targetContactId,
                connectionType
            }
        })
    } catch (error) {
        console.error("Failed to create connection:", error)
        return { message: "Database Error" }
    }

    revalidatePath("/relations")
    return { message: "Success" }
}

export async function deleteConnection(sourceContactId: string, targetContactId: string) {
    const session = await auth()
    if (!session?.user?.id) return { message: "Unauthorized" }

    try {
        await prisma.connection.delete({
            where: {
                sourceContactId_targetContactId: {
                    sourceContactId,
                    targetContactId
                },
                userId: session.user.id
            }
        })
    } catch (error) {
        console.error("Failed to delete connection:", error)
        return { message: "Database Error" }
    }

    revalidatePath("/relations")
    return { message: "Success" }
}

export async function getNetworkData() {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")
    const userId = session.user.id

    const contacts = await prisma.contact.findMany({
        where: { userId },
        select: { id: true, fullName: true, profilePicture: true, group: { select: { name: true } } }
    })

    const connections = await prisma.connection.findMany({
        where: { userId },
        select: { sourceContactId: true, targetContactId: true, connectionType: true }
    })

    return { contacts, connections }
}

export async function searchContacts(query: string) {
    const session = await auth()
    if (!session?.user?.id) return []
    const userId = session.user.id

    return await prisma.contact.findMany({
        where: {
            userId,
            fullName: { contains: query, mode: 'insensitive' }
        },
        select: { id: true, fullName: true, profilePicture: true },
        take: 10
    })
}
