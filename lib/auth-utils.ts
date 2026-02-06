/**
 * Checks if the given email belongs to an admin.
 * The admin email is defined in the environment variable ADMIN_EMAIL.
 */
export function isAdmin(email?: string | null): boolean {
    if (!email) return false
    const adminEmails = (process.env.ADMIN_EMAIL || "").split(",").map(e => e.trim())
    // If no admin email is configured, no one is admin
    if (adminEmails.length === 0) return false

    return adminEmails.includes(email)
}
