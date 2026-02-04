"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { authenticate } from "@/app/lib/actions"
// useFormState is in canary/experimental but standard in Next 14+ patterns
import { useActionState } from "react"
import { useFormStatus } from "react-dom"

export function LoginForm({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"div">) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [errorMessage, dispatch, isPending] = useActionState(authenticate, undefined)

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Login</CardTitle>
                    <CardDescription>
                        Enter your email below to login to your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={dispatch}>
                        <div className="flex flex-col gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    required
                                    name="email"
                                />
                            </div>
                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Password</Label>
                                    <a
                                        href="#"
                                        className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                                    >
                                        Forgot your password?
                                    </a>
                                </div>
                                <Input id="password" type="password" required name="password" />
                            </div>
                            <LoginButton />
                            <div className="flex h-8 items-end space-x-1" aria-live="polite" aria-atomic="true">
                                {errorMessage && (
                                    <p className="text-sm text-red-500">{errorMessage}</p>
                                )}
                            </div>
                        </div>
                        <div className="mt-4 text-center text-sm text-muted-foreground">
                            For demo use: <b>admin@odyssi.com</b> / <b>odyssi</b>
                        </div>
                    </form>
                </CardContent>
            </Card>
            <div className="text-center">
                <Link href="/">
                    <Button variant="ghost" className="gap-2">
                        <ArrowLeft className="h-4 w-4" /> Back to Home
                    </Button>
                </Link>
            </div>
        </div>
    )
}

function LoginButton() {
    const { pending } = useFormStatus()

    return (
        <Button aria-disabled={pending} type="submit" className="w-full">
            {pending ? "Signing in..." : "Login"}
        </Button>
    )
}
