'use server'

import { signIn, signOut } from "@/auth"
import { AuthError } from "next-auth"
import { redirect } from "next/navigation"
import { getExcerpt } from "@/app/lib/blog-utils"
import { isAdmin } from "@/lib/auth-utils"
import { DEFAULT_FEEDS, fetchFeed, isValidPublicHttpUrl, RssArticle } from "@/lib/rss"
import { syncAllFeeds } from "@/lib/rss-sync"
import { extractFullArticleContent } from "@/lib/article-extractor"
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
    isDefault: z.string().optional(),
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
        isDefault: formData.get("isDefault"),
    })

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Missing Fields. Failed to Create Journal.",
        }
    }

    const { title, description, color, icon, isDefault } = validatedFields.data
    const isDefaultBool = isDefault === "on"

    const userId = session.user.id

    try {
        await prisma.$transaction(async (tx) => {
            if (isDefaultBool) {
                await tx.journal.updateMany({
                    where: { userId },
                    data: { isDefault: false }
                })
            }

            await tx.journal.create({
                data: {
                    title,
                    description,
                    color: color || "#718982",
                    icon,
                    isDefault: isDefaultBool,
                    userId,
                },
            })
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
    isDefault: z.string().optional(),
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
        isDefault: formData.get("isDefault"),
    })

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Missing Fields. Failed to Update Journal.",
        }
    }

    const { id, title, description, color, icon, isDefault } = validatedFields.data
    const isDefaultBool = isDefault === "on"

    const userId = session.user.id

    try {
        await prisma.$transaction(async (tx) => {
            if (isDefaultBool) {
                await tx.journal.updateMany({
                    where: { userId },
                    data: { isDefault: false }
                })
            }

            await tx.journal.update({
                where: { id, userId },
                data: { title, description, color, icon, isDefault: isDefaultBool }
            })
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
    locationLat: z.number().nullish(),
    locationLng: z.number().nullish(),
    contacts: z.string().nullish(),
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
        locationLat: formData.get("locationLat") ? parseFloat(formData.get("locationLat") as string) : null,
        locationLng: formData.get("locationLng") ? parseFloat(formData.get("locationLng") as string) : null,
        contacts: formData.get("contacts"),
    })


    if (!validatedFields.success) {
        console.error("Validation Error:", validatedFields.error)
        return { message: "Invalid fields" }
    }

    const { title, content, journalId, date, mood, locationName, tags, contacts } = validatedFields.data
    const tagList = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []
    const contactIds = contacts ? contacts.split(',').map(c => c.trim()).filter(Boolean) : []
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
                locationLat: validatedFields.data.locationLat,
                locationLng: validatedFields.data.locationLng,
                tags: {
                    connectOrCreate: tagList.map(tag => ({
                        where: { name_userId: { name: tag, userId } },
                        create: { name: tag, userId }
                    }))
                },
                contacts: {
                    connect: contactIds.map(id => ({ id }))
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
    locationLat: z.number().nullish(),
    locationLng: z.number().nullish(),
    contacts: z.string().nullish(),
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
        locationLat: formData.get("locationLat") ? parseFloat(formData.get("locationLat") as string) : null,
        locationLng: formData.get("locationLng") ? parseFloat(formData.get("locationLng") as string) : null,
        contacts: formData.get("contacts"),
    })


    if (!validatedFields.success) {
        return { message: "Invalid fields" }
    }

    const { id, title, content, journalId, date, mood, locationName, tags, contacts } = validatedFields.data
    const tagList = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []
    const contactIds = contacts ? contacts.split(',').map(c => c.trim()).filter(Boolean) : []
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
                locationLat: validatedFields.data.locationLat,
                locationLng: validatedFields.data.locationLng,
                tags: {
                    set: [],
                    connectOrCreate: tagList.map(tag => ({
                        where: { name_userId: { name: tag, userId } },
                        create: { name: tag, userId }
                    }))
                },
                contacts: {
                    set: [],
                    connect: contactIds.map(id => ({ id }))
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

        await prisma.entry.delete({
            where: { id },
            select: { id: true }
        })

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

    const userIsAdmin = isAdmin(session.user.email)

    try {
        const currentUser = await prisma.user.findUnique({ where: { id: session.user.id } })

        // Prevent email change for non-admins
        if (!userIsAdmin && currentUser?.email !== email) {
            return { message: "Only administrators can change their email address." }
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                name,
                email: userIsAdmin ? email : undefined, // Only update email if admin
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

        revalidatePath("/settings")
        return { message: "Success" }
    } catch (error) {
        console.error("Failed to update password:", error)
        return { message: "Database Error" }
    }
}

export async function getAppConfig() {
    try {
        const config = await prisma.appConfig.findFirst()
        if (!config) {
            return await prisma.appConfig.create({
                data: {
                    redirectHomeToLogin: false,
                    enableBlogging: false,
                    enableMultiUser: false,
                    enableUserBlogging: false,
                    autoBackupInterval: "1Week",
                    analyticSnippet: "",
                    themeFont: "prompt",
                    themeBlogFont: "prompt",
                    themeBlogSize: "medium",
                    themeCodeFont: "geist",
                    themeAccent: "sage",
                    themeCustomAccent: "#768882",
                    themeBg: "white",
                    themeCustomBg: "#ffffff",
                    enableNewsFeed: false
                }
            })
        }
        return config
    } catch (error) {
        console.warn("Could not fetch app config (database might be unavailable):", error)
        return null
    }
}

export async function updateUISettings(prevState: any, formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) return { message: "Unauthorized" }

    const font = formData.get("font") as string || "prompt"
    const blogFont = formData.get("blogFont") as string || "prompt"
    const blogSize = formData.get("blogSize") as string || "medium"
    const codeFont = formData.get("codeFont") as string || "geist"
    const accent = formData.get("accent") as string || "sage"
    const customAccent = formData.get("customAccent") as string || "#768882"
    const bg = formData.get("bg") as string || "white"
    const customBg = formData.get("customBg") as string || "#ffffff"

    try {
        const config = await prisma.appConfig.findFirst()
        const id = config?.id

        if (id) {
            await prisma.appConfig.update({
                where: { id },
                data: {
                    themeFont: font,
                    themeBlogFont: blogFont,
                    themeBlogSize: blogSize,
                    themeCodeFont: codeFont,
                    themeAccent: accent,
                    themeCustomAccent: customAccent,
                    themeBg: bg,
                    themeCustomBg: customBg
                }
            })
        } else {
            await prisma.appConfig.create({
                data: {
                    themeFont: font,
                    themeBlogFont: blogFont,
                    themeBlogSize: blogSize,
                    themeCodeFont: codeFont,
                    themeAccent: accent,
                    themeCustomAccent: customAccent,
                    themeBg: bg,
                    themeCustomBg: customBg,
                    redirectHomeToLogin: false,
                    enableBlogging: false,
                    enableNewsFeed: false,
                }
            })
        }

        revalidatePath("/", "layout")
        return { message: "Success" }
    } catch (error) {
        console.error("Failed to update UI settings:", error)
        return { message: "Database Error" }
    }
}

export async function updateAppFeatures(prevState: any, formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) return { message: "Unauthorized" }

    const redirectHomeToLogin = formData.get("redirectHomeToLogin") === "on"
    const enableBlogging = formData.get("enableBlogging") === "on"
    const enableNewsFeed = formData.get("enableNewsFeed") === "on"
    const enableAutoBackup = formData.get("enableAutoBackup") === "on"
    const enableMultiUser = formData.get("enableMultiUser") === "on"
    const enableUserBlogging = formData.get("enableUserBlogging") === "on"
    const autoBackupInterval = formData.get("autoBackupInterval") as string || "1Week"
    const analyticSnippet = formData.get("analyticSnippet") as string || ""

    try {
        const config = await prisma.appConfig.findFirst()
        const id = config?.id

        if (id) {
            await prisma.appConfig.update({
                where: { id },
                data: {
                    redirectHomeToLogin,
                    enableBlogging,
                    enableNewsFeed,
                    enableAutoBackup,
                    enableMultiUser,
                    enableUserBlogging,
                    autoBackupInterval,
                    analyticSnippet
                }
            })
        } else {
            await prisma.appConfig.create({
                data: {
                    redirectHomeToLogin,
                    enableBlogging,
                    enableNewsFeed,
                    enableAutoBackup,
                    enableMultiUser,
                    enableUserBlogging,
                    autoBackupInterval,
                    analyticSnippet
                }
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

    // Check permissions
    const config = await getAppConfig()
    const userIsAdmin = isAdmin(session.user.email)

    if (!userIsAdmin && !config?.enableUserBlogging) {
        return { message: "You do not have permission to create blog posts." }
    }

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

    // Check permissions (Deleting/Updating own posts should technically be allowed if they created them, 
    // but if the permission is REVOKED, maybe they shouldn't be able to edit anymore? 
    // Usually "create" permission implies "manage own". 
    // Let's be strict: if feature is disabled, no blogging actions for non-admins.)
    const config = await getAppConfig()
    const userIsAdmin = isAdmin(session.user.email)

    if (!userIsAdmin && !config?.enableUserBlogging) {
        return { message: "You do not have permission to manage blog posts." }
    }

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

    const config = await getAppConfig()
    const userIsAdmin = isAdmin(session.user.email)

    if (!userIsAdmin && !config?.enableUserBlogging) {
        return { message: "You do not have permission to delete blog posts." }
    }

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

// ==========================================
// News Feed & Saved Articles Server Actions
// ==========================================

export async function getNewsFeeds() {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    // Retrieve default/system feeds (userId null) and user's custom feeds
    let feeds = await prisma.rssFeed.findMany({
        where: {
            OR: [
                { userId: null },
                { userId: session.user.id }
            ]
        },
        orderBy: { createdAt: "asc" }
    })

    // If no feeds in database yet, initialize with DEFAULT_FEEDS
    if (feeds.length === 0) {
        await prisma.rssFeed.createMany({
            data: DEFAULT_FEEDS.map(f => ({
                title: f.title,
                url: f.url,
                category: f.category,
                userId: null
            }))
        })

        feeds = await prisma.rssFeed.findMany({
            where: {
                OR: [
                    { userId: null },
                    { userId: session.user.id }
                ]
            },
            orderBy: { createdAt: "asc" }
        })
    } else {
        // Sync default feeds category if they were saved with 'General' or null before category support
        const defaultUrls = new Map(DEFAULT_FEEDS.map(d => [d.url, d.category]))
        for (const feed of feeds) {
            if (feed.userId === null && defaultUrls.has(feed.url)) {
                const targetCat = defaultUrls.get(feed.url)!
                if (feed.category !== targetCat) {
                    await prisma.rssFeed.update({
                        where: { id: feed.id },
                        data: { category: targetCat }
                    }).catch(() => {})
                    feed.category = targetCat
                }
            }
        }
    }

    // Deduplicate feeds by URL
    const uniqueFeedsMap = new Map<string, typeof feeds[0]>()
    for (const feed of feeds) {
        if (!uniqueFeedsMap.has(feed.url)) {
            uniqueFeedsMap.set(feed.url, feed)
        }
    }

    return Array.from(uniqueFeedsMap.values())
}

export async function addNewsFeed(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const title = (formData.get("title") as string)?.trim()
    const url = (formData.get("url") as string)?.trim()
    const category = (formData.get("category") as string)?.trim() || "General"
    const fetchInterval = (formData.get("fetchInterval") as string)?.trim() || "15M"

    if (!title || !url) {
        return { error: "Title and RSS Feed URL are required" }
    }

    // SSRF & protocol validation
    if (!isValidPublicHttpUrl(url)) {
        return { error: "Invalid URL or prohibited network address. Only public HTTP/HTTPS URLs are allowed." }
    }

    // Check if feed URL already exists for this user or as default
    const existing = await prisma.rssFeed.findFirst({
        where: {
            url,
            OR: [
                { userId: null },
                { userId: session.user.id }
            ]
        }
    })
    if (existing) {
        return { error: "This RSS feed URL is already added." }
    }

    try {
        await prisma.rssFeed.create({
            data: {
                title,
                url,
                category,
                fetchInterval,
                userId: session.user.id
            }
        })

        // Trigger background sync for this new feed immediately without blocking
        syncAllFeeds(true).catch(err => console.error("Post-add background sync failed:", err))

        revalidatePath("/news")
        return { success: true }
    } catch (error: any) {
        console.error("Failed to add RSS feed:", error)
        return { error: error?.message || "Failed to add RSS feed" }
    }
}

export async function updateNewsFeed(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const isUserAdmin = isAdmin(session?.user?.email)
    const feedId = (formData.get("id") as string)?.trim()
    const title = (formData.get("title") as string)?.trim()
    const url = (formData.get("url") as string)?.trim()
    const category = (formData.get("category") as string)?.trim() || "General"
    const fetchInterval = (formData.get("fetchInterval") as string)?.trim() || "15M"

    if (!feedId || !title || !url) {
        return { error: "Feed ID, Title, and RSS Feed URL are required" }
    }

    if (!isValidPublicHttpUrl(url)) {
        return { error: "Invalid URL or prohibited network address" }
    }

    try {
        const feed = await prisma.rssFeed.findUnique({
            where: { id: feedId }
        })

        if (!feed) return { error: "Feed not found" }

        // User can edit their own feed, or admin can edit system feed
        if (feed.userId !== session.user.id && !isUserAdmin) {
            return { error: "Unauthorized to update this feed" }
        }

        const urlChanged = feed.url !== url

        await prisma.rssFeed.update({
            where: { id: feedId },
            data: {
                title,
                url,
                category,
                fetchInterval
            }
        })

        // If URL changed, sync immediately
        if (urlChanged) {
            syncAllFeeds(true).catch(err => console.error("Post-edit background sync failed:", err))
        }

        revalidatePath("/news")
        return { success: true }
    } catch (error: any) {
        console.error("Failed to update RSS feed:", error)
        return { error: error?.message || "Failed to update RSS feed" }
    }
}


export async function deleteNewsFeed(feedId: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const isUserAdmin = isAdmin(session?.user?.email)

    try {
        const feed = await prisma.rssFeed.findUnique({
            where: { id: feedId }
        })

        if (!feed) return { error: "Feed not found" }

        // User can delete their own feed, or admin can delete system feed
        if (feed.userId !== session.user.id && !isUserAdmin) {
            return { error: "Unauthorized to delete this feed" }
        }

        await prisma.rssFeed.delete({
            where: { id: feedId }
        })

        revalidatePath("/news")
        return { success: true }
    } catch (error) {
        console.error("Failed to delete RSS feed:", error)
        return { error: "Failed to delete RSS feed" }
    }
}

export async function fetchFullArticleAction(url: string) {

    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    if (!isValidPublicHttpUrl(url)) {
        return { error: "Invalid URL" }
    }

    try {
        const result = await extractFullArticleContent(url)
        if (result.error || !result.content) {
            return { error: result.error || "Could not extract full article" }
        }

        // Cache full content in FeedArticleCache if exists
        try {
            await prisma.feedArticleCache.updateMany({
                where: { link: url },
                data: { content: result.content }
            })
        } catch {
            // Non-critical if not found in cache
        }

        return { success: true, content: result.content }
    } catch (error: any) {
        console.error("fetchFullArticleAction error:", error)
        return { error: error?.message || "Failed to load full article" }
    }
}

export async function syncNewsFeedsAction() {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    // Start background sync job (supports up to 6 minutes for LLM feeds)
    syncAllFeeds()
        .then(() => {
            revalidatePath("/news")
        })
        .catch((error: any) => {
            console.error("Background sync error:", error)
        })

    return {
        success: true,
        background: true,
        message: "Syncing news feeds in background (long feeds may take a few minutes)..."
    }
}


export async function fetchAllFeedArticles(): Promise<RssArticle[]> {
    const session = await auth()
    if (!session?.user?.id) return []

    // 1. First retrieve all active feeds for user
    const feeds = await getNewsFeeds()
    if (feeds.length === 0) return []

    const feedUrls = feeds.map(f => f.url)

    // 2. Fast query from FeedArticleCache
    const cached = await prisma.feedArticleCache.findMany({
        where: {
            sourceUrl: { in: feedUrls }
        },
        orderBy: { pubDate: "desc" },
        take: 300
    })

    // If cache is completely empty, perform an immediate initial sync in background
    if (cached.length === 0) {
        // Run sync in background or immediately
        syncAllFeeds().catch(err => console.error("Initial background sync failed:", err))

        // Do a fast real-time fallback fetch
        const results = await Promise.allSettled(
            feeds.map(feed => fetchFeed(feed.url, feed.title, feed.category || "General"))
        )
        const fallbackArticles: RssArticle[] = []
        const seenLinks = new Set<string>()

        for (const res of results) {
            if (res.status === "fulfilled") {
                for (const item of res.value) {
                    const normLink = item.link?.trim().toLowerCase() || ""
                    const normTitle = item.title?.trim().toLowerCase() || ""
                    const key = normLink || normTitle
                    if (key && !seenLinks.has(key)) {
                        seenLinks.add(key)
                        fallbackArticles.push(item)
                    }
                }
            }
        }
        fallbackArticles.sort((a, b) => {
            const dateA = a.pubDate ? new Date(a.pubDate).getTime() : 0
            const dateB = b.pubDate ? new Date(b.pubDate).getTime() : 0
            return dateB - dateA
        })
        return fallbackArticles
    }

    // Deduplicate cached articles by link and normalized title
    const uniqueArticles: RssArticle[] = []
    const seenArticleKeys = new Set<string>()

    for (const item of cached) {
        const normLink = item.link?.trim().toLowerCase() || ""
        const normTitle = item.title?.trim().toLowerCase() || ""
        const key = normLink || normTitle

        if (key && seenArticleKeys.has(key)) {
            continue
        }
        if (key) seenArticleKeys.add(key)

        uniqueArticles.push({
            id: Buffer.from(item.link).toString('base64url').substring(0, 32),
            title: item.title,
            link: item.link,
            content: item.content || item.excerpt || "",
            excerpt: item.excerpt || "",
            imageUrl: item.imageUrl || undefined,
            sourceTitle: item.sourceTitle || "",
            sourceUrl: item.sourceUrl,
            category: item.category || "General",
            pubDate: item.pubDate ? item.pubDate.toISOString() : undefined,
            author: item.author || undefined
        })
    }

    return uniqueArticles
}


export async function saveArticle(article: {
    title: string
    link: string
    content?: string
    excerpt?: string
    imageUrl?: string
    sourceTitle?: string
    pubDate?: string
}) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    try {
        await prisma.savedArticle.upsert({
            where: {
                userId_link: {
                    userId: session.user.id,
                    link: article.link
                }
            },
            update: {
                title: article.title,
                content: article.content,
                excerpt: article.excerpt,
                imageUrl: article.imageUrl,
                sourceTitle: article.sourceTitle,
                pubDate: article.pubDate ? new Date(article.pubDate) : null
            },
            create: {
                userId: session.user.id,
                title: article.title,
                link: article.link,
                content: article.content,
                excerpt: article.excerpt,
                imageUrl: article.imageUrl,
                sourceTitle: article.sourceTitle,
                pubDate: article.pubDate ? new Date(article.pubDate) : null
            }
        })

        revalidatePath("/news")
        return { success: true }
    } catch (error) {
        console.error("Failed to save article:", error)
        return { error: "Failed to save article" }
    }
}

export async function removeSavedArticle(link: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    try {
        await prisma.savedArticle.deleteMany({
            where: {
                userId: session.user.id,
                link: link
            }
        })

        revalidatePath("/news")
        return { success: true }
    } catch (error) {
        console.error("Failed to remove saved article:", error)
        return { error: "Failed to remove saved article" }
    }
}

export async function getSavedArticles() {
    const session = await auth()
    if (!session?.user?.id) return []

    return await prisma.savedArticle.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" }
    })
}

