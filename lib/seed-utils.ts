import { prisma } from './prisma'

export async function seedAdminUser() {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@odyssi.com'

        // Check if admin already exists to avoid unnecessary writes
        const existingAdmin = await prisma.user.findUnique({
            where: { email: adminEmail },
        })

        if (existingAdmin) {
            console.log('Admin user already exists.')
            return
        }

        const admin = await prisma.user.upsert({
            where: { email: adminEmail },
            update: {
                passwordHash: 'odyssi'
            },
            create: {
                email: adminEmail,
                name: 'Admin Traveler',
                passwordHash: 'odyssi',
                id: 'dev-admin'
            },
        })
        console.log('Admin user seeded:', admin.email)
    } catch (error) {
        console.error('Error seeding admin user:', error)
    }
}
