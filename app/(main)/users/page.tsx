import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { isAdmin } from "@/lib/auth-utils"
import { getUsers } from "@/app/lib/actions"
import { UserManagement } from "@/components/users/user-management"

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
    const session = await auth()

    // Protect route logic
    if (!session?.user?.id) return redirect("/login")
    if (!isAdmin(session.user.email)) {
        return redirect("/dashboard")
    }

    const users = await getUsers()

    return (
        <div className="container mx-auto py-6 max-w-5xl">
            <UserManagement users={users} />
        </div>
    )
}
