import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getAppConfig, getNewsFeeds, fetchAllFeedArticles, getSavedArticles } from "@/app/lib/actions"
import { isAdmin } from "@/lib/auth-utils"
import { NewsClient } from "@/components/news/news-client"

export const dynamic = "force-dynamic"

export default async function NewsPage() {
    const session = await auth()
    if (!session?.user?.id) return redirect("/login")

    const config = await getAppConfig()
    // If news feed feature is disabled in settings, redirect to dashboard
    if (!config?.enableNewsFeed) {
        return redirect("/dashboard")
    }

    const isUserAdmin = isAdmin(session.user.email)

    // Parallel fetch feeds, parsed articles, and saved articles
    const [feeds, articles, savedArticles] = await Promise.all([
        getNewsFeeds(),
        fetchAllFeedArticles(),
        getSavedArticles()
    ])

    return (
        <NewsClient
            initialFeeds={feeds}
            initialArticles={articles}
            initialSavedArticles={savedArticles}
            currentUserId={session.user.id}
            isAdmin={isUserAdmin}
        />
    )
}
