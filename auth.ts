import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import { PrismaClient } from "@prisma/client"
import { authConfig } from "./auth.config"

import { prisma } from "@/lib/prisma"

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

                // Verify password (In real app: await bcrypt.compare(password, user.passwordHash))
                // For now, simple comparison or assuming we are developing
                // WARNING: INSECURE - replace with hashing
                if (user.passwordHash !== password) {
                    throw new Error("Invalid credentials.")
                }

                // return user object provided to session
                return user
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
            }
            return token
        },
        async session({ session, token }) {
            if (token?.id && session.user) {
                session.user.id = token.id as string
            }
            return session
        }
    }
})
