import NextAuth from "next-auth"
import { authConfig } from "./auth.config"

export default NextAuth(authConfig).auth

export const config = {
    // Protect all routes except: auth API, static assets, uploads (media needs to be
    // publicly reachable for shared/public entries), and image extensions.
    matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|uploads|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
