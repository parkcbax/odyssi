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
                    // For MVP development, if no user exists, let's create one magically ONLY if it says "admin@odyssi.com" (Development convenience)
                    // In a real app, you'd have a sign-up flow.
                    // TODO: REMOVE THIS IN PRODUCTION
                    if (email === "admin@odyssi.com" && password === "odyssi") {
                        // Ensure this dev user actually exists in the DB so foreign keys work
                        const user = await prisma.user.upsert({
                            where: { email: "admin@odyssi.com" },
                            update: {},
                            create: {
                                id: "dev-admin",
                                name: "Admin Traveler",
                                email: "admin@odyssi.com",
                            }
                        })
                        return user
                    }
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
            }

            // Handle session update
            if (trigger === "update" && session) {
                token.name = session.name || token.name
                token.email = session.email || token.email
            }

            return token
        },
        async session({ session, token }) {
            if (token?.id && session.user) {
                session.user.id = token.id as string
                session.user.name = token.name as string
                session.user.email = token.email as string
            }
            return session
        }
    }
})
