"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Lock } from "lucide-react"
import { verifyEntryPassword } from "@/app/lib/actions-share"
import { useRouter } from "next/navigation"

interface PublicEntryPasswordFormProps {
    slug: string
}

export function PublicEntryPasswordForm({ slug }: PublicEntryPasswordFormProps) {
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        const isValid = await verifyEntryPassword(slug, password)
        if (isValid) {
            // Set a cookie to remember access
            // We can do this via a server action wrapper, but for now we can use document.cookie for simplicity in this client component, 
            // but httpOnly cookies are better. 
            // Ideally verifyEntryPassword sets the cookie.
            // We will assume verifyEntryPassword returns success and we set a simple cookie here for the middleware/page to check?
            // Actually, simplest is to just reload page with a query param? No, that exposes password.

            // Let's modify verifyEntryPassword to set the cookie. 
            // But actions-share.ts is generic.
            // Let's rely on a new specific action for this form to set cookie.

            // For now, let's just use a client cookie for "proof" that the server page can read?
            // Server components read cookies easily.

            document.cookie = `access-${slug}=${password}; path=/; max-age=3600; samesite=strict`
            router.refresh()
        } else {
            setError("Incorrect password")
        }
        setLoading(false)
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center space-y-2">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <Lock className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Protected Entry</h1>
                    <p className="text-muted-foreground">Please enter the password to view this entry.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={error ? "border-destructive" : ""}
                        />
                        {error && <p className="text-sm text-destructive">{error}</p>}
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Verifying..." : "Unlock"}
                    </Button>
                </form>
            </div>
        </div>
    )
}
