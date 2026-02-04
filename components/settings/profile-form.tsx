"use client"

import { useActionState, useEffect } from "react"
import { useFormStatus } from "react-dom"
import { updateProfile, updatePassword } from "@/app/lib/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

interface ProfileFormProps {
    user: {
        name: string | null
        email: string
    }
}

export function ProfileForm({ user }: ProfileFormProps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [state, dispatch] = useActionState(updateProfile, {} as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [pwdState, pwdDispatch] = useActionState(updatePassword, {} as any)

    const router = useRouter()
    const { update: updateSession } = useSession()

    useEffect(() => {
        if (state?.message === "Success") {
            toast.success("Profile updated successfully")

            // Extract values from form if possible or just trigger update
            // Since we don't have the values here directly unless we use state for inputs,
            // we'll just trigger a session update which will re-fetch or use defaults.
            // Better: update session with the new name if we want immediate UI update.
            const nameInput = document.getElementById('name') as HTMLInputElement
            const emailInput = document.getElementById('email') as HTMLInputElement

            updateSession({
                name: nameInput?.value,
                email: emailInput?.value
            })

            router.refresh()
        } else if (state?.message && state.message !== "Success") {
            toast.error(state.message)
        }
    }, [state, router, updateSession])

    useEffect(() => {
        if (pwdState?.message === "Success") {
            toast.success("Password updated successfully")
        } else if (pwdState?.message && pwdState.message !== "Success") {
            toast.error(pwdState.message)
        }
    }, [pwdState])

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Public Profile</CardTitle>
                    <CardDescription>
                        Update your account information.
                    </CardDescription>
                </CardHeader>
                <form action={dispatch}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" name="name" defaultValue={user.name || ""} required />
                            {state?.errors?.name && <p className="text-sm text-red-500">{state.errors.name}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" defaultValue={user.email} required />
                            {state?.errors?.email && <p className="text-sm text-red-500">{state.errors.email}</p>}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <SubmitButton text="Save Changes" />
                    </CardFooter>
                </form>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>
                        Ensure your account is using a long, random password to stay secure.
                    </CardDescription>
                </CardHeader>
                <form action={pwdDispatch}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <Input id="currentPassword" name="currentPassword" type="password" required />
                            {pwdState?.errors?.currentPassword && <p className="text-sm text-red-500">{pwdState.errors.currentPassword}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input id="newPassword" name="newPassword" type="password" required />
                            {pwdState?.errors?.newPassword && <p className="text-sm text-red-500">{pwdState.errors.newPassword}</p>}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <SubmitButton text="Update Password" />
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}

function SubmitButton({ text }: { text: string }) {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : text}
        </Button>
    )
}
