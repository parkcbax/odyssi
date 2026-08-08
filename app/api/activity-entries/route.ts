import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getContentSnippet, getFirstImage, getAllImages } from '@/lib/editor-utils'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get('ids')
    if (!idsParam) {
        return NextResponse.json({ error: 'Missing ids parameter' }, { status: 400 })
    }

    const ids = idsParam.split(',').map(s => s.trim()).filter(Boolean)
    if (ids.length === 0 || ids.length > 500) {
        return NextResponse.json({ error: 'Invalid ids parameter' }, { status: 400 })
    }

    try {
        const entries = await prisma.entry.findMany({
            where: {
                journal: { userId: session.user.id },
                id: { in: ids }
            },
            orderBy: { date: 'desc' },
            select: {
                id: true,
                title: true,
                date: true,
                mood: true,
                locationName: true,
                journal: true,
                tags: true,
                images: true,
                content: true
            }
        })

        const hydrated = entries.map(entry => {
            const { content, ...rest } = entry
            return {
                ...rest,
                content,
                snippet: content ? getContentSnippet(content).substring(0, 300) : "",
                firstImage: content ? getFirstImage(content) : null,
                contentImages: content ? getAllImages(content) : []
            }
        })

        return NextResponse.json({ entries: hydrated })
    } catch (error) {
        console.error('Activity entries fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 })
    }
}
