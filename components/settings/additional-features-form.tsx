"use client"

import { useActionState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { updateAppFeatures } from "@/app/lib/actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface AdditionalFeaturesFormProps {
    redirectHomeToLogin: boolean
    enableBlogging: boolean
    enableMultiUser: boolean
    enableUserBlogging: boolean
    analyticSnippet?: string | null
}

export function AdditionalFeaturesForm({ redirectHomeToLogin, enableBlogging, enableMultiUser, enableUserBlogging, analyticSnippet }: AdditionalFeaturesFormProps) {
    const [state, formAction, isPending] = useActionState(updateAppFeatures, null)
    const router = useRouter()

    useEffect(() => {
        if (state?.message === "Success") {
            toast.success("Features updated successfully")
            router.refresh()
        } else if (state?.message) {
            toast.error(state.message)
        }
    }, [state, router])

    return (
        <form action={formAction}>
            <Card>
                <CardHeader>
                    <CardTitle>Additional Features</CardTitle>
                    <CardDescription>
                        Enable or disable optional system features.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                            <Label htmlFor="redirectHomeToLogin" className="text-base">Redirect Home to Login</Label>
                            <p className="text-sm text-muted-foreground">
                                If enabled, the home landing page will automatically redirect visitors to the login page.
                            </p>
                        </div>
                        <Switch
                            id="redirectHomeToLogin"
                            name="redirectHomeToLogin"
                            defaultChecked={redirectHomeToLogin}
                        />
                    </div>
                    <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                            <Label htmlFor="enableBlogging" className="text-base">Blogging Feature</Label>
                            <p className="text-sm text-muted-foreground">
                                If enabled, adds a "Blog" section to the sidebar and allows you to publish public posts.
                            </p>
                        </div>
                        <Switch
                            id="enableBlogging"
                            name="enableBlogging"
                            defaultChecked={enableBlogging}
                        />
                    </div>
                    <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                            <Label htmlFor="enableMultiUser" className="text-base">Multi-User Support</Label>
                            <p className="text-sm text-muted-foreground">
                                If enabled, allows Admins to manage multiple users and users to login.
                            </p>
                        </div>
                        <Switch
                            id="enableMultiUser"
                            name="enableMultiUser"
                            defaultChecked={enableMultiUser}
                        />
                    </div>

                    {enableMultiUser && (
                        <div className="flex items-center justify-between space-x-2 pl-6 border-l-2">
                            <div className="space-y-0.5">
                                <Label htmlFor="enableUserBlogging" className="text-base">Allow Users Create Blog Post</Label>
                                <p className="text-sm text-muted-foreground">
                                    If enabled, registered users (non-admins) can also create blog posts.
                                </p>
                            </div>
                            <Switch
                                id="enableUserBlogging"
                                name="enableUserBlogging"
                                defaultChecked={enableUserBlogging}
                            />
                        </div>
                    )}

                    <div className="space-y-2 pt-4 border-t">
                        <Label htmlFor="analyticSnippet" className="text-base">Analytic Snippet</Label>
                        <p className="text-sm text-muted-foreground">
                            Paste your analytic tracking code here (e.g., Google Analytics). This will be injected into every page.
                        </p>
                        <Textarea
                            id="analyticSnippet"
                            name="analyticSnippet"
                            placeholder="<script>...</script>"
                            defaultValue={analyticSnippet || ""}
                            className="font-mono text-sm h-32"
                        />
                    </div>

                    <Button type="submit" disabled={isPending}>
                        {isPending ? "Saving..." : "Save Changes"}
                    </Button>
                </CardContent>
            </Card>
        </form>
    )
}
