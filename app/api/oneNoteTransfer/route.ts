import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

async function handleTransfer(
    journalTitle: string | null,
    entryDate: string | null,
    entryTitle: string | null,
    entryContent: string | null,
    userEmail: string | null = null,
) {
    if (!journalTitle || !entryTitle) {
        return NextResponse.json({ error: "Missing required fields: Journals, EntryTitle" }, { status: 400 })
    }

    const session = await auth()
    let userId = session?.user?.id

    if (!userId) {
        // Fallback for temporary API script - allow UserEmail parameter
        let authUser = null;
        if (typeof userEmail === 'string' && userEmail.trim() !== '') {
            authUser = await prisma.user.findUnique({
                where: { email: userEmail }
            });
        }

        if (authUser) {
            userId = authUser.id;
        } else {
            const firstUser = await prisma.user.findFirst()
            if (firstUser) {
                userId = firstUser.id
            } else {
                return NextResponse.json({ error: "Unauthorized and no users found" }, { status: 401 })
            }
        }
    }

    // Find or create journal
    let journal = await prisma.journal.findFirst({
        where: {
            title: journalTitle,
            userId: userId
        }
    })

    if (!journal) {
        journal = await prisma.journal.create({
            data: {
                title: journalTitle,
                userId: userId,
                color: "#718982"
            }
        })
    }

    // Tiptap JSON content format for custom HTML block
    const tiptapContent = {
        type: "doc",
        content: [
            {
                type: "customHTML",
                attrs: {
                    content: entryContent || ""
                }
            }
        ]
    }

    const entry = await prisma.entry.create({
        data: {
            title: entryTitle,
            content: tiptapContent as any,
            date: entryDate ? new Date(entryDate) : new Date(),
            journalId: journal.id
        }
    })

    return NextResponse.json({
        success: true,
        message: "Transfer successful",
        journalId: journal.id,
        entryId: entry.id
    })
}



export async function POST(req: NextRequest) {
    try {
        let body: any = {}
        const contentType = req.headers.get("content-type") || ""

        if (contentType.includes("application/json")) {
            body = await req.json()
        } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
            const formData = await req.formData()
            body = {
                Journals: formData.get("Journals") as string,
                EntryDate: formData.get("EntryDate") as string,
                EntryTitle: formData.get("EntryTitle") as string,
                EntryContent: formData.get("EntryContent") as string,
                UserEmail: formData.get("UserEmail") as string
            }
        }

        return await handleTransfer(
            body.Journals,
            body.EntryDate,
            body.EntryTitle,
            body.EntryContent,
            body.UserEmail
        )
    } catch (error) {
        console.error("Transfer error:", error)
        return NextResponse.json({ error: "Transfer failed", details: String(error) }, { status: 500 })
    }
}
