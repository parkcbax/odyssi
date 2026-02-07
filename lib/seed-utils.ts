import { prisma } from './prisma'

export async function seedAdminUser() {
    try {
        const adminEmails = (process.env.ADMIN_EMAIL || 'admin@odyssi.com').split(',')

        for (const rawEmail of adminEmails) {
            const adminEmail = rawEmail.trim()
            if (!adminEmail) continue

            // Strategy: First admin gets "dev-admin" ID for backwards compat, others get auto-generated ID.
            // Actually, safe bet is: if ID "dev-admin" exists, fine. If not, just create user with auto ID.
            // OR we can just omit ID for everyone except the original "dev-admin" user if specifically needed.
            // Simpler: Just upsert by email. If it's a new user, let Prisma/DB handle ID (using default CUID).
            // BUT: Original code forced id: 'dev-admin'. To preserve that for the PRIMARY admin (legacy):

            const createData: any = {
                email: adminEmail,
                name: 'Admin Traveler',
                passwordHash: 'odyssi'
            }

            // Only force the specific ID for 'admin@odyssi.com' or the FIRST one if we really want to stick to that pattern.
            // Let's attach 'dev-admin' only if email is explicitly 'admin@odyssi.com' to allow multiple separate admins.
            if (adminEmail === 'admin@odyssi.com') {
                createData.id = 'dev-admin'
            }

            const admin = await prisma.user.upsert({
                where: { email: adminEmail },
                update: {
                    passwordHash: 'odyssi' // Ensure password is set/reset to default on start
                },
                create: createData,
            })
            console.log('Admin user seeded:', admin.email)
        }
    } catch (error) {
        console.error('Error seeding admin user:', error)
    }
}
