import { prisma } from './prisma'
import { hash } from 'bcryptjs'

export async function seedAdminUser() {
    try {
        const adminEmails = (process.env.ADMIN_EMAIL || 'admin@odyssi.com').split(',')
        const adminPassword = process.env.ADMIN_PASSWORD

        for (const rawEmail of adminEmails) {
            const adminEmail = rawEmail.trim()
            if (!adminEmail) continue

            // Determine password strategy
            let passwordHash = 'odyssi' // Default for new installs if no env var
            if (adminPassword) {
                // If env var is set, use it (hashed)
                passwordHash = await hash(adminPassword, 12)
            } else {
                // If no env var, use default hash for 'odyssi'
                // We pre-calculate this or hash it on the fly. 'odyssi' hashed is roughly:
                // But let's just hash it to be safe and consistent.
                passwordHash = await hash('odyssi', 12)
            }

            const createData: any = {
                email: adminEmail,
                name: 'Admin Traveler',
                passwordHash: passwordHash
            }

            // Only force the specific ID for 'admin@odyssi.com' or the FIRST one if we really want to stick to that pattern.
            if (adminEmail === 'admin@odyssi.com') {
                createData.id = 'dev-admin'
            }

            // Prepare update data
            const updateData: any = {}

            // SECURITY: Only update password if explicitly requested via env var
            // OR if we want to ensure default password on fresh installs.
            // If ADMIN_PASSWORD is provided, ALWAYS update it (Reset mechanism).
            if (adminPassword) {
                updateData.passwordHash = passwordHash
                console.log(`[SEED] Admin password updated for ${adminEmail} (from ADMIN_PASSWORD)`)
            }

            // If we are creating, we use createData (which has the password).
            // If we are updating, we use updateData (which might be empty if no ADMIN_PASSWORD).

            const admin = await prisma.user.upsert({
                where: { email: adminEmail },
                update: updateData,
                create: createData,
            })

            if (updateData.passwordHash || admin.createdAt.getTime() === admin.updatedAt.getTime()) {
                console.log('Admin user seeded/updated:', admin.email)
            } else {
                console.log('Admin user verified:', admin.email)
            }
        }
    } catch (error) {
        console.error('Error seeding admin user:', error)
    }
}
