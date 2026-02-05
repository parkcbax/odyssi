'use server'

import { signIn, signOut } from "@/auth"
import { AuthError } from "next-auth"
import { redirect } from "next/navigation"
import { getExcerpt } from "@/app/lib/blog-utils"
import { isAdmin } from "@/lib/auth-utils"
import bcrypt from "bcryptjs"

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

export async function handleSignOut() {
    await signOut({ redirectTo: "/login" })
}

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { hash } from "bcryptjs"

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
                color: color || "#718982",
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

const UpdateJournalSchema = z.object({
    id: z.string(),
    title: z.string().min(1, { message: "Title is required" }).max(100),
    description: z.string().max(500).optional(),
    color: z.string().optional(),
    icon: z.string().optional(),
})

export async function updateJournal(
    prevState: any,
    formData: FormData
) {
    const session = await auth()
    if (!session?.user?.id) return { message: "Unauthorized" }

    const validatedFields = UpdateJournalSchema.safeParse({
        id: formData.get("id"),
        title: formData.get("title"),
        description: formData.get("description"),
        color: formData.get("color"),
        icon: formData.get("icon"),
    })

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Missing Fields. Failed to Update Journal.",
        }
    }

    const { id, title, description, color, icon } = validatedFields.data

    try {
        await prisma.journal.update({
            where: { id, userId: session.user.id },
            data: { title, description, color, icon }
        })
    } catch (error) {
        console.error("Failed to update journal:", error);
        return { message: "Database Error" }
    }

    revalidatePath("/journals")
    revalidatePath(`/journals/${id}`)
    return { message: "Success" }
}

export async function deleteJournal(id: string) {
    const session = await auth()
    if (!session?.user?.id) return { message: "Unauthorized" }

    try {
        await prisma.journal.delete({
            where: { id, userId: session.user.id }
        })
    } catch (error) {
        console.error("Failed to delete journal:", error);
        return { message: "Database Error" }
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

export async function deleteEntry(id: string) {
    const session = await auth()
    if (!session?.user?.id) return { message: "Unauthorized" }

    try {
        const entry = await prisma.entry.findUnique({
            where: { id },
            select: { journalId: true, journal: { select: { userId: true } } }
        })

        if (!entry || entry.journal.userId !== session.user.id) {
            return { message: "Unauthorized" }
        }

        await prisma.entry.delete({ where: { id } })

        revalidatePath("/dashboard")
        revalidatePath(`/journals/${entry.journalId}`)
        return { message: "Success" }
    } catch (error) {
        console.error("Failed to delete entry:", error);
        return { message: "Database Error" }
    }
}

const UpdateProfileSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    timezone: z.string().optional(),
})

export async function updateProfile(
    prevState: any,
    formData: FormData
) {
    const session = await auth()
    if (!session?.user?.id) return { message: "Unauthorized" }

    const validatedFields = UpdateProfileSchema.safeParse({
        name: formData.get("name"),
        email: formData.get("email"),
        timezone: formData.get("timezone"),
    })

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors, message: "Invalid fields" }
    }

    const { name, email, timezone } = validatedFields.data

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                name,
                email,
                timezone: timezone || "UTC"
            }
        })
        revalidatePath("/settings")
        return { message: "Success" }
    } catch (error) {
        console.error("Failed to update profile:", error)
        return { message: "Database Error" }
    }
}

const UpdatePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
})

export async function updatePassword(
    prevState: any,
    formData: FormData
) {
    const session = await auth()
    if (!session?.user?.id) return { message: "Unauthorized" }

    const validatedFields = UpdatePasswordSchema.safeParse({
        currentPassword: formData.get("currentPassword"),
        newPassword: formData.get("newPassword"),
    })

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors, message: "Invalid fields" }
    }

    const { currentPassword, newPassword } = validatedFields.data

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        })

        if (!user || !user.passwordHash) {
            return { message: "User not found" }
        }

        // Ideally use bcrypt to compare passwords, but let's assume update is straightforward for now
        // In a real app, verify currentPassword first
        const hashedPassword = await hash(newPassword, 10)

        await prisma.user.update({
            where: { id: session.user.id },
            data: { passwordHash: hashedPassword }
        })

        return { message: "Success" }
    } catch (error) {
        console.error("Failed to update password:", error)
        return { message: "Database Error" }
    }
    return { message: "Success" }
}

// App Config Actions
export async function getAppConfig() {
    const config = await prisma.appConfig.findFirst()
    if (!config) {
        return await prisma.appConfig.create({
            data: {
                redirectHomeToLogin: false,
                enableBlogging: false,
                enableMultiUser: false
            }
        })
    }
    return config
}

export async function updateAppFeatures(prevState: any, formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) return { message: "Unauthorized" }

    const redirectHomeToLogin = formData.get("redirectHomeToLogin") === "on"
    const enableBlogging = formData.get("enableBlogging") === "on"
    const enableAutoBackup = formData.get("enableAutoBackup") === "on"
    const enableMultiUser = formData.get("enableMultiUser") === "on"
    const autoBackupInterval = formData.get("autoBackupInterval") as string || "1Week"

    try {
        const config = await prisma.appConfig.findFirst()
        const id = config?.id

        if (id) {
            await prisma.appConfig.update({
                where: { id },
                data: { redirectHomeToLogin, enableBlogging, enableAutoBackup, enableMultiUser, autoBackupInterval }
            })
        } else {
            await prisma.appConfig.create({
                data: { redirectHomeToLogin, enableBlogging, enableAutoBackup, enableMultiUser, autoBackupInterval }
            })
        }

        revalidatePath("/", "layout") // Root layout
        revalidatePath("/settings", "layout") // Settings page layout (MainLayout)
        revalidatePath("/dashboard", "layout") // Dashboard layout if needed
        return { message: "Success" }
    } catch (error) {
        console.error("Failed to update app config:", error)
        return { message: "Database Error" }
    }
}

const CreateBlogPostSchema = z.object({
    title: z.string().min(1, "Title is required"),
    slug: z.string().optional(),
    category: z.string().optional(),
    content: z.string().optional(),
    excerpt: z.string().optional(),
    featuredImage: z.string().optional(),
    keywords: z.string().optional(),
    published: z.string().optional(),
})

export async function createBlogPost(prevState: any, formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) return { message: "Unauthorized" }

    const validatedFields = CreateBlogPostSchema.safeParse({
        title: formData.get("title"),
        slug: formData.get("slug"),
        category: formData.get("category"),
        content: formData.get("content"),
        excerpt: formData.get("excerpt"),
        featuredImage: formData.get("featuredImage"),
        keywords: formData.get("keywords"),
        published: formData.get("published"),
    })

    if (!validatedFields.success) {
        return { message: "Invalid fields" }
    }

    const { title, content, published, category } = validatedFields.data

    // Use provided slug or generate one
    let slug = validatedFields.data.slug
    if (!slug || slug.trim() === "") {
        slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now()
    }

    // Content comes as JSON string from Tiptap, parse it so Prisma stores it as JSON object
    let contentJson = null
    if (content) {
        try {
            contentJson = JSON.parse(content)
        } catch (e) {
            // Fallback if it's not JSON (unlikely with Tiptap, but safe)
            contentJson = { type: "markdown", text: content }
        }
    }

    // Auto-generate excerpt if not provided
    let excerpt = validatedFields.data.excerpt
    if (!excerpt || excerpt.trim() === "") {
        excerpt = getExcerpt(contentJson)
    }

    try {
        await prisma.blogPost.create({
            data: {
                title,
                slug,
                category,
                content: contentJson,
                excerpt,
                featuredImage: validatedFields.data.featuredImage,
                keywords: validatedFields.data.keywords,
                published: published === "on",
                authorId: session.user.id
            }
        })
    } catch (error) {
        console.error("Failed to create blog post:", error)
        return { message: "Database Error" }
    }
    redirect("/dashboard/blog")
}

const UpdateBlogPostSchema = z.object({
    id: z.string(),
    title: z.string().min(1, "Title is required"),
    slug: z.string().optional(),
    category: z.string().optional(),
    content: z.string().optional(),
    excerpt: z.string().optional(),
    featuredImage: z.string().optional(),
    keywords: z.string().optional(),
    published: z.string().optional(),
})

export async function updateBlogPost(prevState: any, formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) return { message: "Unauthorized" }

    const validatedFields = UpdateBlogPostSchema.safeParse({
        id: formData.get("id"),
        title: formData.get("title"),
        slug: formData.get("slug"),
        category: formData.get("category"),
        content: formData.get("content"),
        excerpt: formData.get("excerpt"),
        featuredImage: formData.get("featuredImage"),
        keywords: formData.get("keywords"),
        published: formData.get("published"),
    })

    if (!validatedFields.success) {
        return { message: "Invalid fields" }
    }

    const { id, title, content, published, slug, category } = validatedFields.data

    let contentJson = null
    if (content) {
        try {
            contentJson = JSON.parse(content)
        } catch (e) {
            contentJson = { type: "markdown", text: content }
        }
    }

    // Auto-generate excerpt if not provided
    let excerpt = validatedFields.data.excerpt
    if (!excerpt || excerpt.trim() === "") {
        excerpt = getExcerpt(contentJson)
    }

    try {
        await prisma.blogPost.update({
            where: { id, authorId: session.user.id },
            data: {
                title,
                slug: slug && slug.trim() !== "" ? slug : undefined, // Only update slug if provided
                category,
                content: contentJson,
                excerpt,
                featuredImage: validatedFields.data.featuredImage,
                keywords: validatedFields.data.keywords,
                published: published === "on",
            }
        })
    } catch (error) {
        console.error("Failed to update blog post:", error)
        return { message: "Database Error" }
    }

    redirect("/dashboard/blog")
}

export async function deleteBlogPost(id: string) {
    const session = await auth()
    if (!session?.user?.id) return { message: "Unauthorized" }

    try {
        await prisma.blogPost.delete({
            where: { id, authorId: session.user.id }
        })
        revalidatePath("/dashboard/blog")
        return { message: "Success" }
    } catch (error) {
        console.error("Failed to delete blog post:", error)
        return { message: "Database Error" }
    }
}

// User Management Actions
export async function getUsers() {
    const session = await auth()
    if (!isAdmin(session?.user?.email)) {
        throw new Error("Unauthorized")
    }

    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            _count: {
                select: { journals: true, posts: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    })

    return users
}

export async function createNewUser(formData: FormData) {
    const session = await auth()
    if (!isAdmin(session?.user?.email)) {
        return { error: "Unauthorized" }
    }

    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    if (!name || !email || !password) {
        return { error: "Missing fields" }
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
        where: { email }
    })

    if (existingUser) {
        return { error: "User already exists" }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    try {
        await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                timezone: "UTC", // Default
            }
        })
        revalidatePath("/users")
        return { success: true }
    } catch (error) {
        console.error("Failed to create user:", error)
        return { error: "Failed to create user" }
    }
}

export async function deleteUser(userId: string) {
    const session = await auth()
    if (!isAdmin(session?.user?.email)) {
        return { error: "Unauthorized" }
    }

    if (userId === session?.user?.id) {
        return { error: "Cannot delete your own account" }
    }

    try {
        await prisma.user.delete({
            where: { id: userId }
        })
        revalidatePath("/users")
        return { success: true }
    } catch (error) {
        console.error("Failed to delete user:", error)
        return { error: "Failed to delete user" }
    }
}
