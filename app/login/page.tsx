import { GalleryVerticalEnd } from "lucide-react"
import Image from "next/image"
import { LoginForm } from "@/components/login-form"
import { Book } from "lucide-react"

export default function LoginPage() {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
            <div className="flex w-full max-w-sm flex-col gap-6">
                <a href="#" className="flex items-center gap-2 self-center font-medium">
                    <div className="relative h-8 w-8">
                        <Image src="/assets/odyssi_logo.png" alt="Odyssi Logo" fill className="object-contain" />
                    </div>
                    Odyssi
                </a>
                <LoginForm />
            </div>
        </div>
    )
}
