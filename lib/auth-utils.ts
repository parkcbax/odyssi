/**
 * Checks if the given email belongs to an admin.
 * The admin email is defined in the environment variable ADMIN_EMAIL.
 */
export function isAdmin(email?: string | null): boolean {
    if (!email) return false
    const adminEmail = process.env.ADMIN_EMAIL
    // If no admin email is configured, no one is admin
    if (!adminEmail) return false

    return email === adminEmail
}
