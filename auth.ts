import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import { authConfig } from "./auth.config"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// Schema to validate login input
const signInSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1, "Password is required"),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                const { email, password } = await signInSchema.parseAsync(credentials)

                // Find user by email
                const user = await prisma.user.findUnique({
                    where: { email }
                })

                if (!user) {
                    throw new Error("User not found.")
                }

                // Verify password
                // Check if the stored password is a hash (starts with $2)
                const isHash = user.passwordHash?.startsWith("$2")

                if (isHash) {
                    const passwordsMatch = await bcrypt.compare(password, user.passwordHash!)
                    if (!passwordsMatch) {
                        throw new Error("Invalid credentials.")
                    }
                } else {
                    // Fallback for legacy/dev/plain text passwords
                    console.warn("WARNING: checking plain text password for user:", email)
                    if (user.passwordHash !== password) {
                        throw new Error("Invalid credentials.")
                    }
                    // Optionally: Upgrade to hash on successful login? 
                    // For now, let's just allow it.
                }

                // return user object provided to session
                return user
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id
                token.name = user.name
                token.email = user.email
                token.timezone = (user as any).timezone || "UTC"
            }

            // Handle session update
            if (trigger === "update" && session) {
                token.name = session.name || token.name
                token.email = session.email || token.email
                token.timezone = session.timezone || token.timezone
            }

            return token
        },
        async session({ session, token }) {
            if (token?.id && session.user) {
                session.user.id = token.id as string
                session.user.name = token.name as string
                session.user.email = token.email as string
                session.user.timezone = token.timezone as string
            }
            return session
        }
    }
})
