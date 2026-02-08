import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })


async function fixEntries() {
    console.log('Starting entry content fix...')
    const entries = await prisma.entry.findMany()
    let fixedCount = 0

    console.log(`Found ${entries.length} entries. Scanning...`)

    for (const entry of entries) {
        const content = entry.content as any

        // Skip if content is not a valid doc structure
        if (!content || content.type !== 'doc' || !Array.isArray(content.content)) {
            continue
        }

        // Check if we have any "bad" code blocks
        // A "bad" code block is one that seems to wrap the entire meaningful content, 
        // often identified by having 'json' language or being the dominant node.
        // We will look for code blocks at the top level.

        const preservedNodes: any[] = []
        const recoveredNodes: any[] = []
        let hasChanges = false

        for (const node of content.content) {
            // Logic to identify the accidental code block. 
            // It usually has language='json' (from the bug) and contains text.
            if (node.type === 'codeBlock') { //  && node.attrs?.language === 'json'
                const textContent = node.content && node.content[0] ? node.content[0].text : ''

                if (!textContent) {
                    // Empty code block, maybe just remove it? Or keep it if user intended?
                    // If we are "fixing", we assume these are errors. 
                    // But if user manually wrote a code block, we shouldn't destroy it.
                    // The bug characteristic is that it wraps "normal" text.
                    // Let's try to detect if it's "stringified JSON" first.
                    preservedNodes.push(node)
                    continue
                }

                // Try to parse as JSON
                try {
                    const parsed = JSON.parse(textContent)
                    if (parsed.type === 'doc' && Array.isArray(parsed.content)) {
                        console.log(`Entry ${entry.id}: Found stringified Tiptap JSON in code block. Unwrapping...`)
                        recoveredNodes.push(...parsed.content)
                        hasChanges = true
                        continue
                    }
                } catch (e) {
                    // Not JSON
                }

                // If not JSON, it might be plain text that got wrapped.
                // WE ONLY UNWRAP if we are "sure" it's the bug. 
                // The bug tends to wrap the *entire* entry.
                // If there are multiple code blocks, maybe we shouldn't touch them blindly?
                // However, the User specifically asked to "fix" entries rendering as JSON code blocks.
                // Let's assume for now we convert to paragraphs if it looks like prose (e.g. contains spaces, long text).

                // For safety: specifically target the "json" language ones which seem to be the regression default?
                if (node.attrs?.language === 'json') {
                    console.log(`Entry ${entry.id}: Converting JSON code block to paragraphs ("${textContent.substring(0, 30)}...")...`)

                    const paragraphs = textContent.split(/\n\n+/).map((text: string) => ({
                        type: 'paragraph',
                        content: [{
                            type: 'text',
                            text: text.trim()
                        }]
                    }))
                    recoveredNodes.push(...paragraphs)
                    hasChanges = true
                } else {
                    preservedNodes.push(node)
                }

            } else {
                // Not a code block, preserve it (e.g. Image, Heading, etc.)
                preservedNodes.push(node)
            }
        }

        if (hasChanges) {
            // We put recovered nodes first (usually the text), then preserved nodes (unless preserved were before?)
            // Actually, we lost order if we split them.
            // Better strategy: map the original array.

            const newContentArray: any[] = []

            for (const node of content.content) {
                if (node.type === 'codeBlock' && node.attrs?.language === 'json') {
                    const textContent = node.content && node.content[0] ? node.content[0].text : ''
                    if (textContent) {
                        // Try JSON parse
                        let unwrapped = false
                        try {
                            const parsed = JSON.parse(textContent)
                            if (parsed.type === 'doc' && Array.isArray(parsed.content)) {
                                newContentArray.push(...parsed.content)
                                unwrapped = true
                            }
                        } catch (e) { }

                        if (!unwrapped) {
                            // Convert to paras
                            const paragraphs = textContent.split(/\n\n+/).map((text: string) => ({
                                type: 'paragraph',
                                content: [{
                                    type: 'text',
                                    text: text.trim()
                                }]
                            }))
                            newContentArray.push(...paragraphs)
                        }
                    } else {
                        // Empty, ignore or keep? ignore.
                    }
                } else {
                    newContentArray.push(node)
                }
            }

            const newContent = {
                type: 'doc',
                content: newContentArray
            }

            console.log(`Saving fix for ${entry.id}...`)
            try {
                await prisma.entry.update({
                    where: { id: entry.id },
                    data: { content: newContent }
                })
                fixedCount++
            } catch (err) {
                console.error(`Failed to update ${entry.id}:`, err)
            }
        }
    }

    console.log(`Finished! Fixed ${fixedCount} entries.`)
}

fixEntries()
    .catch(e => {
        console.error(e)
        // process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
