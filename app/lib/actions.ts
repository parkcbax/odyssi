'use server'

import { signIn } from "@/auth"
import { AuthError } from "next-auth"

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        await signIn('credentials', { ...Object.fromEntries(formData), redirectTo: '/dashboard' })
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials.'
                default:
                    return 'Something went wrong.'
            }
        }
        throw error
    }
}
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

const CreateJournalSchema = z.object({
    title: z.string().min(1, { message: "Title is required" }).max(100),
    description: z.string().max(500).optional(),
    color: z.string().optional(),
    icon: z.string().optional(),
})

export async function createJournal(
    prevState: any,
    formData: FormData
) {
    const session = await auth()
    if (!session?.user?.id) {
        return { message: "Unauthorized" }
    }

    const validatedFields = CreateJournalSchema.safeParse({
        title: formData.get("title"),
        description: formData.get("description"),
        color: formData.get("color"),
        icon: formData.get("icon"),
    })

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Missing Fields. Failed to Create Journal.",
        }
    }

    const { title, description, color, icon } = validatedFields.data

    try {
        console.log("Creating journal for user:", session.user.id);
        console.log("Data:", { title, description, color, icon });
        await prisma.journal.create({
            data: {
                title,
                description,
                color: color || "#4F46E5",
                icon,
                userId: session.user.id,
            },
        })
    } catch (error) {
        console.error("Failed to create journal:", error);
        return { message: "Database Error: Failed to Create Journal." }
    }

    revalidatePath("/journals")
    return { message: "Success" }
}

const CreateEntrySchema = z.object({
    title: z.string().min(1, "Title is required"),
    content: z.string().nullish(),
    journalId: z.string().min(1, "Journal is required"),
    date: z.string().nullish(),
    mood: z.string().nullish(),
    locationName: z.string().nullish(),
    tags: z.string().nullish(),
})

export async function createEntry(
    prevState: any,
    formData: FormData
) {
    const session = await auth()
    if (!session?.user?.id) return { message: "Unauthorized" }

    const validatedFields = CreateEntrySchema.safeParse({
        title: formData.get("title"),
        content: formData.get("content"),
        journalId: formData.get("journalId"),
        date: formData.get("date"),
        mood: formData.get("mood"),
        locationName: formData.get("locationName"),
        tags: formData.get("tags"),
    })

    if (!validatedFields.success) {
        console.error("Validation Error:", validatedFields.error)
        return { message: "Invalid fields" }
    }

    const { title, content, journalId, date, mood, locationName, tags } = validatedFields.data
    const tagList = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []
    const userId = session.user.id

    console.log("Creating Entry:", { title, journalId, date, mood, locationName, tags: tagList })

    try {
        await prisma.entry.create({
            data: {
                title,
                content: content ? JSON.parse(content) : undefined,
                journalId,
                date: date ? new Date(date) : new Date(),
                mood,
                locationName,
                tags: {
                    connectOrCreate: tagList.map(tag => ({
                        where: { name_userId: { name: tag, userId } },
                        create: { name: tag, userId }
                    }))
                }
            }
        })
    } catch (error) {
        console.error("Failed to create entry:", error)
        return { message: "Database Error" }
    }

    revalidatePath("/dashboard")
    revalidatePath(`/journals/${journalId}`)
    return { message: "Success" }
}

const UpdateEntrySchema = z.object({
    id: z.string(),
    title: z.string().min(1, "Title is required"),
    content: z.string().nullish(),
    journalId: z.string().min(1, "Journal is required"),
    date: z.string().nullish(),
    mood: z.string().nullish(),
    locationName: z.string().nullish(),
    tags: z.string().nullish(),
})

export async function updateEntry(
    prevState: any,
    formData: FormData
) {
    const session = await auth()
    if (!session?.user?.id) return { message: "Unauthorized" }

    const validatedFields = UpdateEntrySchema.safeParse({
        id: formData.get("id"),
        title: formData.get("title"),
        content: formData.get("content"),
        journalId: formData.get("journalId"),
        date: formData.get("date"),
        mood: formData.get("mood"),
        locationName: formData.get("locationName"),
        tags: formData.get("tags"),
    })

    if (!validatedFields.success) {
        return { message: "Invalid fields" }
    }

    const { id, title, content, journalId, date, mood, locationName, tags } = validatedFields.data
    const tagList = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []
    const userId = session.user.id

    try {
        await prisma.entry.update({
            where: {
                id: id,
                journal: { userId }
            },
            data: {
                title,
                content: content ? JSON.parse(content) : undefined,
                journalId,
                date: date ? new Date(date) : undefined,
                mood,
                locationName,
                tags: {
                    set: [],
                    connectOrCreate: tagList.map(tag => ({
                        where: { name_userId: { name: tag, userId } },
                        create: { name: tag, userId }
                    }))
                }
            }
        })
    } catch (error) {
        console.error("Failed to update entry:", error)
        return { message: "Database Error" }
    }

    revalidatePath(`/entries/${id}`)
    revalidatePath(`/journals/${journalId}`)
    return { message: "Success" }
}
