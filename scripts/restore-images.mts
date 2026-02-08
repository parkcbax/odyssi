
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function restoreImages() {
    console.log('Starting image restoration...')
    const entries = await prisma.entry.findMany({
        include: {
            images: true
        }
    })

    let restoredCount = 0

    console.log(`Found ${entries.length} entries to scan.`)

    for (const entry of entries) {
        // MATCH TARGET ENTRY FOR DEBUGGING
        const isTarget = entry.id === 'cml7tyev000010hrv04uupx59';

        if (entry.images.length === 0) {
            if (isTarget) console.log(`Target entry ${entry.id} has 0 images in Asset table.`);
            continue
        }

        if (isTarget) {
            console.log(`Target entry ${entry.id} has ${entry.images.length} assets:`, entry.images.map(i => i.url));
        }

        const content = entry.content as any
        let hasChanges = false

        // Ensure content structure exists
        let newContent = content
        if (!newContent || newContent.type !== 'doc' || !Array.isArray(newContent.content)) {
            // Should verify if we need to init, but for now assume valid doc from previous fix
            continue;
        }

        // Get all existing image sources in the content
        const currentImages = new Set<string>()

        function scanForImages(node: any) {
            if (node.type === 'image' || node.type === 'custom-image') {
                if (node.attrs && node.attrs.src) {
                    currentImages.add(node.attrs.src)
                }
            }
            if (node.content && Array.isArray(node.content)) {
                node.content.forEach(scanForImages)
            }
        }
        scanForImages(newContent)

        // Find missing images
        const missingImages = entry.images.filter(img => !currentImages.has(img.url))

        if (missingImages.length > 0) {
            console.log(`Entry ${entry.id} ("${entry.title}") has ${missingImages.length} missing images via Asset table. Restoring...`)

            // Append missing images to the end of the document
            const imageNodes = missingImages.map(img => ({
                type: 'image', // Or 'custom-image' depending on your extension, but standard 'image' is safer fallback usually, let's allow editor to handle? 
                // Wait, EntryEditor uses CustomImage. Let's check how it serializes. 
                // Usually it extends Image, so type might be 'image' or 'customImage'.
                // Let's use 'image' for now as it's standard.
                attrs: {
                    src: img.url,
                    alt: '',
                    title: ''
                }
            }))

            // Add a separator paragraph before images if needed
            newContent.content.push({ type: 'paragraph' })
            newContent.content.push(...imageNodes)

            hasChanges = true
        }

        if (hasChanges) {
            await prisma.entry.update({
                where: { id: entry.id },
                data: { content: newContent }
            })
            restoredCount++
        }
    }

    console.log(`Finished! Restored images in ${restoredCount} entries.`)
}

restoreImages()
    .catch(e => {
        console.error(e)
        // process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
