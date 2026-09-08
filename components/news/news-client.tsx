"use client"

import { useState, useEffect, useTransition } from "react"
import {
    Newspaper,
    Bookmark,
    BookmarkCheck,
    ExternalLink,
    Plus,
    Trash2,
    RefreshCw,
    Search,
    Rss,
    Calendar,
    Globe,
    Filter,
    Clock,
    X,
    FolderPlus,
    Edit3
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription
} from "@/components/ui/sheet"
import { toast } from "sonner"
import { addNewsFeed, updateNewsFeed, deleteNewsFeed, saveArticle, removeSavedArticle, syncNewsFeedsAction, fetchFullArticleAction } from "@/app/lib/actions"
import { RssArticle } from "@/lib/rss"
import { useRouter } from "next/navigation"

interface FeedSource {
    id: string
    title: string
    url: string
    category: string | null
    fetchInterval?: string | null
    lastFetchedAt?: Date | string | null
    userId: string | null
}


interface SavedArticleItem {
    id: string
    title: string
    link: string
    content: string | null
    excerpt: string | null
    imageUrl: string | null
    sourceTitle: string | null
    pubDate: string | Date | null
}

interface NewsClientProps {
    initialFeeds: FeedSource[]
    initialArticles: RssArticle[]
    initialSavedArticles: SavedArticleItem[]
    currentUserId: string
    isAdmin: boolean
}

function getImageProxyUrl(url: string | null | undefined): string | undefined {
    if (!url) return undefined
    if (url.startsWith('/api/proxy/image')) return url
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return `/api/proxy/image?url=${encodeURIComponent(url)}`
    }
    return url
}

export function NewsClient({
    initialFeeds,
    initialArticles,
    initialSavedArticles,
    currentUserId,
    isAdmin
}: NewsClientProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [isFiltering, startFilterTransition] = useTransition()

    const [feeds, setFeeds] = useState<FeedSource[]>(initialFeeds)
    const [articles, setArticles] = useState<RssArticle[]>(initialArticles)
    const [savedArticles, setSavedArticles] = useState<SavedArticleItem[]>(initialSavedArticles)

    // Sync state when server props update (e.g. after router.refresh() or feed addition)
    useEffect(() => {
        setArticles(initialArticles)
    }, [initialArticles])

    useEffect(() => {
        setSavedArticles(initialSavedArticles)
    }, [initialSavedArticles])

    useEffect(() => {
        setFeeds(initialFeeds)
    }, [initialFeeds])

    const [selectedFeed, setSelectedFeed] = useState<string>("all")
    const [selectedCategory, setSelectedCategory] = useState<string>("all")
    const [searchQuery, setSearchQuery] = useState<string>("")
    const [readingArticle, setReadingArticle] = useState<RssArticle | SavedArticleItem | null>(null)
    const [isLoadingFullArticle, setIsLoadingFullArticle] = useState<boolean>(false)

    // Handler to fetch full article content when only excerpt is present
    const handleFetchFullArticle = async (article: RssArticle | SavedArticleItem) => {
        if (!article.link) return
        setIsLoadingFullArticle(true)
        try {
            const res = await fetchFullArticleAction(article.link)
            if (res.success && res.content) {
                // Update readingArticle with full content
                setReadingArticle(prev => prev ? { ...prev, content: res.content } : null)
                // Also update in articles state so reopening has full content
                setArticles(prev => prev.map(a => a.link === article.link ? { ...a, content: res.content } : a))
                toast.success("Loaded full article text")
            } else {
                toast.error(res.error || "Could not extract full content from website")
            }
        } catch {
            toast.error("Failed to fetch full article")
        } finally {
            setIsLoadingFullArticle(false)
        }
    }


    // Feed Source Dialog state (Add & Edit)
    const [isAddFeedOpen, setIsAddFeedOpen] = useState(false)
    const [editingFeed, setEditingFeed] = useState<FeedSource | null>(null)
    const [newFeedTitle, setNewFeedTitle] = useState("")
    const [newFeedUrl, setNewFeedUrl] = useState("")
    const [newFeedCategory, setNewFeedCategory] = useState("General")
    const [newFeedInterval, setNewFeedInterval] = useState("15M")
    const [feedError, setFeedError] = useState("")

    const openAddFeedModal = () => {
        setEditingFeed(null)
        setNewFeedTitle("")
        setNewFeedUrl("")
        setNewFeedCategory("General")
        setNewFeedInterval("15M")
        setFeedError("")
        setIsAddFeedOpen(true)
    }

    const openEditFeedModal = (feed: FeedSource) => {
        setEditingFeed(feed)
        setNewFeedTitle(feed.title)
        setNewFeedUrl(feed.url)
        setNewFeedCategory(feed.category || "General")
        setNewFeedInterval(feed.fetchInterval || "15M")
        setFeedError("")
        setIsAddFeedOpen(true)
    }

    const handleSaveFeed = async (e: React.FormEvent) => {
        e.preventDefault()
        setFeedError("")

        if (!newFeedTitle.trim() || !newFeedUrl.trim()) {
            setFeedError("Please enter both feed title and URL")
            return
        }

        const formData = new FormData()
        if (editingFeed) {
            formData.append("id", editingFeed.id)
        }
        formData.append("title", newFeedTitle.trim())
        formData.append("url", newFeedUrl.trim())
        formData.append("category", newFeedCategory.trim())
        formData.append("fetchInterval", newFeedInterval)

        startTransition(async () => {
            const res = editingFeed
                ? await updateNewsFeed(formData)
                : await addNewsFeed(formData)

            if (res.error) {
                setFeedError(res.error)
                toast.error(res.error)
            } else {
                toast.success(editingFeed ? "Feed updated successfully!" : "Feed added successfully!")
                setIsAddFeedOpen(false)
                setEditingFeed(null)
                setNewFeedTitle("")
                setNewFeedUrl("")
                setNewFeedCategory("General")
                setNewFeedInterval("15M")
                router.refresh()
            }
        })
    }


    const handleDeleteFeed = async (feedId: string) => {
        if (!confirm("Are you sure you want to remove this RSS feed?")) return

        const feedToDelete = feeds.find(f => f.id === feedId)

        // Optimistic feed and articles removal
        setFeeds(prev => prev.filter(f => f.id !== feedId))
        if (feedToDelete) {
            setArticles(prev => prev.filter(a => a.sourceUrl !== feedToDelete.url && a.sourceTitle !== feedToDelete.title))
        }

        startTransition(async () => {
            const res = await deleteNewsFeed(feedId)
            if (res.error) {
                toast.error(res.error)
                router.refresh()
            } else {
                toast.success("Feed deleted")
                router.refresh()
            }
        })
    }

    const handleRefresh = () => {
        startTransition(async () => {
            const res = await syncNewsFeedsAction()
            if (res?.error) {
                toast.error(res.error)
            } else {
                toast.info("RSS sync started in background. Feeds taking up to 5 minutes will update automatically.")
            }
            router.refresh()
        })
    }



    // Extract unique categories from currently active feeds
    const categories = Array.from(
        new Set(
            feeds
                .map(f => f.category?.trim())
                .filter((c): c is string => Boolean(c && c.length > 0))
        )
    ).sort()

    // Dynamically resolve category from currently active feeds
    const getArticleCategory = (art: RssArticle) => {
        const matchingFeed = feeds.find(f => 
            (art.sourceUrl && f.url === art.sourceUrl) || 
            (art.sourceTitle && f.title.trim().toLowerCase() === art.sourceTitle.trim().toLowerCase())
        )
        return (matchingFeed?.category || art.category || "General").trim()
    }

    // Check if an article is saved
    const isSaved = (link: string) => savedArticles.some(s => s.link === link)

    const handleSaveToggle = async (article: RssArticle | SavedArticleItem) => {
        const link = article.link
        const currentlySaved = isSaved(link)

        if (currentlySaved) {
            // Optimistic removal
            setSavedArticles(prev => prev.filter(s => s.link !== link))
            const res = await removeSavedArticle(link)
            if (res.error) {
                toast.error(res.error)
                router.refresh()
            } else {
                toast.success("Article removed from saved")
            }
        } else {
            // Save article
            const newSaved: SavedArticleItem = {
                id: (article as any).id || String(Date.now()),
                title: article.title,
                link: article.link,
                content: article.content || null,
                excerpt: article.excerpt || null,
                imageUrl: article.imageUrl || null,
                sourceTitle: article.sourceTitle || null,
                pubDate: article.pubDate || null
            }
            setSavedArticles(prev => [newSaved, ...prev])

            const res = await saveArticle({
                title: article.title,
                link: article.link,
                content: article.content || undefined,
                excerpt: article.excerpt || undefined,
                imageUrl: article.imageUrl || undefined,
                sourceTitle: article.sourceTitle || undefined,
                pubDate: article.pubDate ? new Date(article.pubDate).toISOString() : undefined
            })

            if (res.error) {
                toast.error(res.error)
                router.refresh()
            } else {
                toast.success("Article saved!")
            }
        }
    }

    // Filter and deduplicate articles
    const seenFilterKeys = new Set<string>()
    const filteredArticles = articles.filter(art => {
        // 1. Must belong to currently active feed
        const isFromActiveFeed = feeds.some(f => 
            (art.sourceUrl && f.url === art.sourceUrl) || 
            (art.sourceTitle && f.title.trim().toLowerCase() === art.sourceTitle.trim().toLowerCase())
        )
        if (!isFromActiveFeed) return false

        // 2. Category matching
        const artCat = getArticleCategory(art).toLowerCase()
        const selCat = selectedCategory.trim().toLowerCase()
        const matchesCategory = selCat === "all" || artCat === selCat

        // 3. Feed source matching
        const artSource = (art.sourceTitle || "").trim().toLowerCase()
        const selFeed = selectedFeed.trim().toLowerCase()
        const matchesFeed = selFeed === "all" || artSource === selFeed || (art.sourceUrl && art.sourceUrl.trim().toLowerCase() === selFeed)

        // 4. Search query matching
        const q = searchQuery.trim().toLowerCase()
        const matchesQuery = q === "" ||
            art.title.toLowerCase().includes(q) ||
            art.excerpt.toLowerCase().includes(q) ||
            artSource.includes(q)

        if (!(matchesFeed && matchesCategory && matchesQuery)) return false

        // 5. In-client deduplication safeguard
        const key = (art.link?.trim().toLowerCase() || "") || (art.title?.trim().toLowerCase() || "")
        if (key && seenFilterKeys.has(key)) return false
        if (key) seenFilterKeys.add(key)

        return true
    })

    const filteredSaved = savedArticles.filter(art => {
        if (!searchQuery) return true
        return (
            art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (art.excerpt && art.excerpt.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (art.sourceTitle && art.sourceTitle.toLowerCase().includes(searchQuery.toLowerCase()))
        )
    })

    // Format date nicely
    const formatDate = (dateString?: string | Date | null) => {
        if (!dateString) return ""
        try {
            const d = new Date(dateString)
            return d.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
            })
        } catch {
            return ""
        }
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                            <Newspaper className="h-7 w-7" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">News Feed</h1>
                            <p className="text-muted-foreground text-sm">
                                Read latest updates from your favorite RSS feeds and magazines.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isPending}
                        className="gap-1.5"
                    >
                        <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>

                    <Button size="sm" onClick={openAddFeedModal} className="gap-1.5">
                        <Plus className="h-4 w-4" />
                        Add Feed Source
                    </Button>

                    <Dialog open={isAddFeedOpen} onOpenChange={setIsAddFeedOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingFeed ? "Edit RSS Feed" : "Add RSS Feed Source"}</DialogTitle>
                                <DialogDescription>
                                    {editingFeed
                                        ? "Update feed settings and sync schedule."
                                        : "Add an RSS or Atom feed link. Only public HTTP/HTTPS URLs are supported."}
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSaveFeed} className="space-y-4 py-2">
                                {feedError && (
                                    <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-lg">
                                        {feedError}
                                    </div>
                                )}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Feed Title</label>
                                    <Input
                                        placeholder="e.g. Hacker News, NYTimes Tech"
                                        value={newFeedTitle}
                                        onChange={e => setNewFeedTitle(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">RSS Feed URL</label>
                                    <Input
                                        placeholder="https://example.com/rss.xml"
                                        value={newFeedUrl}
                                        onChange={e => setNewFeedUrl(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium">Category</label>
                                        <Input
                                            placeholder="Tech, Business, etc."
                                            value={newFeedCategory}
                                            onChange={e => setNewFeedCategory(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium">Sync Interval</label>
                                        <Select
                                            value={newFeedInterval}
                                            onValueChange={setNewFeedInterval}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select interval" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="15M">Every 15 Minutes</SelectItem>
                                                <SelectItem value="1H">Every 1 Hour</SelectItem>
                                                <SelectItem value="6H">Every 6 Hours</SelectItem>
                                                <SelectItem value="12H">Every 12 Hours</SelectItem>
                                                <SelectItem value="1D">Every 1 Day</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsAddFeedOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isPending}>
                                        {isPending ? "Saving..." : editingFeed ? "Save Changes" : "Add Feed"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Main Tabs */}
            <Tabs defaultValue="feed" className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <TabsList className="bg-muted/60 p-1">
                        <TabsTrigger value="feed" className="gap-2">
                            <Rss className="h-4 w-4" />
                            Latest Feeds ({articles.length})
                        </TabsTrigger>
                        <TabsTrigger value="saved" className="gap-2">
                            <Bookmark className="h-4 w-4" />
                            Saved Articles ({savedArticles.length})
                        </TabsTrigger>
                        <TabsTrigger value="manage" className="gap-2">
                            <Globe className="h-4 w-4" />
                            Manage Feeds ({feeds.length})
                        </TabsTrigger>
                    </TabsList>

                    {/* Search Bar */}
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search articles or sources..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="pl-9 pr-8"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Latest Feeds Tab */}
                <TabsContent value="feed" className="space-y-4">
                    {/* Category Filter Chips */}
                    {categories.length > 0 && (
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-sm">
                            <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider flex items-center gap-1 shrink-0">
                                <FolderPlus className="h-3 w-3" /> Categories:
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    startFilterTransition(() => {
                                        setSelectedCategory("all")
                                        setSelectedFeed("all")
                                    })
                                }}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
                                    selectedCategory.toLowerCase() === "all"
                                        ? "bg-primary text-primary-foreground font-semibold"
                                        : "bg-muted hover:bg-muted/80 text-muted-foreground"
                                }`}
                            >
                                All Categories
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => {
                                        startFilterTransition(() => {
                                            setSelectedCategory(cat)
                                            setSelectedFeed("all")
                                        })
                                    }}
                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
                                        selectedCategory.trim().toLowerCase() === cat.trim().toLowerCase()
                                            ? "bg-primary text-primary-foreground font-semibold"
                                            : "bg-muted hover:bg-muted/80 text-muted-foreground"
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Feed Source Filter Chips */}
                    {feeds.length > 0 && (
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-sm border-b pb-3">
                            <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider flex items-center gap-1 shrink-0">
                                <Filter className="h-3 w-3" /> Sources:
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    startFilterTransition(() => {
                                        setSelectedFeed("all")
                                    })
                                }}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
                                    selectedFeed.toLowerCase() === "all"
                                        ? "bg-secondary text-secondary-foreground font-semibold"
                                        : "bg-muted hover:bg-muted/80 text-muted-foreground"
                                }`}
                            >
                                All Sources
                            </button>
                            {feeds.map(feed => (
                                <button
                                    key={feed.id}
                                    type="button"
                                    onClick={() => {
                                        startFilterTransition(() => {
                                            setSelectedFeed(feed.title)
                                        })
                                    }}
                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
                                        selectedFeed.trim().toLowerCase() === feed.title.trim().toLowerCase()
                                            ? "bg-secondary text-secondary-foreground font-semibold"
                                            : "bg-muted hover:bg-muted/80 text-muted-foreground"
                                    }`}
                                >
                                    {feed.title}
                                </button>
                            ))}
                        </div>
                    )}

                    {isFiltering ? (
                        <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                                <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-foreground">Filtering articles...</p>
                                    <p className="text-xs text-muted-foreground">Showing articles matching your category</p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : filteredArticles.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                <Rss className="h-12 w-12 text-muted-foreground/40 mb-3" />
                                <h3 className="text-lg font-semibold">No articles found</h3>
                                <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
                                    {searchQuery
                                        ? `No results matching "${searchQuery}". Try a different keyword.`
                                        : "Could not load articles from active feeds, or no articles are available right now."}
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsAddFeedOpen(true)}
                                    className="gap-2"
                                >
                                    <Plus className="h-4 w-4" /> Add a Feed Source
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredArticles.map(article => {
                                const saved = isSaved(article.link)
                                return (
                                    <Card
                                        key={article.id}
                                        className="group overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-200 border-border/80 hover:border-primary/40 bg-card py-0 gap-0"
                                    >
                                        <div className="cursor-pointer" onClick={() => setReadingArticle(article)}>
                                            {/* Thumbnail Image */}
                                            {article.imageUrl ? (
                                                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                                                    <img
                                                        src={getImageProxyUrl(article.imageUrl)}
                                                        alt={article.title}
                                                        referrerPolicy="no-referrer"
                                                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                        loading="lazy"
                                                        onError={e => {
                                                            // Hide image on error
                                                            (e.target as HTMLElement).style.display = "none"
                                                        }}
                                                    />
                                                    <div className="absolute top-2 left-2 flex items-center gap-1.5 flex-wrap">
                                                        <Badge variant="secondary" className="backdrop-blur-md bg-background/80 text-xs font-semibold shadow-xs">
                                                            {article.sourceTitle}
                                                        </Badge>
                                                        {getArticleCategory(article) && (
                                                            <Badge variant="outline" className="backdrop-blur-md bg-background/80 text-[10px] shadow-xs">
                                                                {getArticleCategory(article)}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-4 pt-4 pb-0 flex items-center justify-between">
                                                    <Badge variant="secondary" className="text-xs font-semibold">
                                                        {article.sourceTitle}
                                                    </Badge>
                                                    {getArticleCategory(article) && (
                                                        <Badge variant="outline" className="text-[10px]">
                                                            {getArticleCategory(article)}
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}

                                            <CardContent className="p-4 space-y-2">
                                                <h2 className="font-semibold text-base line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                                                    {article.title}
                                                </h2>
                                                <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                                                    {article.excerpt}
                                                </p>
                                            </CardContent>
                                        </div>

                                        <div className="px-4 py-3 border-t bg-muted/20 flex items-center justify-between text-xs text-muted-foreground mt-auto">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="h-3.5 w-3.5" />
                                                <span>{formatDate(article.pubDate)}</span>
                                            </div>

                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 hover:text-primary"
                                                    onClick={() => handleSaveToggle(article)}
                                                    title={saved ? "Remove from saved" : "Save article"}
                                                >
                                                    {saved ? (
                                                        <BookmarkCheck className="h-4 w-4 text-primary fill-primary" />
                                                    ) : (
                                                        <Bookmark className="h-4 w-4" />
                                                    )}
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 hover:text-primary"
                                                    asChild
                                                    title="Open original website"
                                                >
                                                    <a href={article.link} target="_blank" rel="noopener noreferrer">
                                                        <ExternalLink className="h-3.5 w-3.5" />
                                                    </a>
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </TabsContent>

                {/* Saved Articles Tab */}
                <TabsContent value="saved" className="space-y-6">
                    {filteredSaved.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                <Bookmark className="h-12 w-12 text-muted-foreground/40 mb-3" />
                                <h3 className="text-lg font-semibold">No saved articles yet</h3>
                                <p className="text-sm text-muted-foreground max-w-sm mt-1">
                                    Bookmark stories from your feed by clicking the bookmark icon on any card to read them later.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredSaved.map(article => (
                                <Card
                                    key={article.id}
                                    className="group overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-200 border-border/80 hover:border-primary/40 bg-card py-0 gap-0"
                                >
                                    <div className="cursor-pointer" onClick={() => setReadingArticle(article as any)}>
                                        {article.imageUrl ? (
                                            <div className="relative aspect-video w-full overflow-hidden bg-muted">
                                                <img
                                                    src={getImageProxyUrl(article.imageUrl)}
                                                    alt={article.title}
                                                    referrerPolicy="no-referrer"
                                                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    loading="lazy"
                                                    onError={e => {
                                                        (e.target as HTMLElement).style.display = "none"
                                                    }}
                                                />
                                                {article.sourceTitle && (
                                                    <div className="absolute top-2 left-2">
                                                        <Badge variant="secondary" className="backdrop-blur-md bg-background/80 text-xs font-semibold">
                                                            {article.sourceTitle}
                                                        </Badge>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            article.sourceTitle && (
                                                <div className="p-4 pt-4 pb-0">
                                                    <Badge variant="secondary" className="text-xs font-semibold">
                                                        {article.sourceTitle}
                                                    </Badge>
                                                </div>
                                            )
                                        )}

                                        <CardContent className="p-4 space-y-2">
                                            <h2 className="font-semibold text-base line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                                                {article.title}
                                            </h2>
                                            <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                                                {article.excerpt}
                                            </p>
                                        </CardContent>
                                    </div>

                                    <div className="px-4 py-3 border-t bg-muted/20 flex items-center justify-between text-xs text-muted-foreground mt-auto">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5" />
                                            <span>{formatDate(article.pubDate)}</span>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                onClick={() => handleSaveToggle(article as any)}
                                                title="Remove from saved"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 hover:text-primary"
                                                asChild
                                                title="Open original website"
                                            >
                                                <a href={article.link} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                </a>
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Manage Feeds Tab */}
                <TabsContent value="manage" className="space-y-6">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between pb-4 border-b mb-4">
                                <div>
                                    <h3 className="font-semibold text-lg">Active Feed Sources</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Customize the websites and news channels you subscribe to.
                                    </p>
                                </div>
                                <Button size="sm" onClick={openAddFeedModal} className="gap-1.5">
                                    <Plus className="h-4 w-4" /> Add Source
                                </Button>

                            </div>

                            <div className="divide-y">
                                {feeds.map(feed => {
                                    const isUserFeed = feed.userId === currentUserId
                                    const canDelete = isUserFeed || isAdmin

                                    return (
                                        <div key={feed.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-medium text-foreground">{feed.title}</span>
                                                    {feed.category && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {feed.category}
                                                        </Badge>
                                                    )}
                                                    {feed.fetchInterval && (
                                                        <Badge variant="secondary" className="text-[10px] gap-1 font-mono">
                                                            <Clock className="h-2.5 w-2.5" />
                                                            {feed.fetchInterval}
                                                        </Badge>
                                                    )}
                                                    {feed.userId === null ? (
                                                        <Badge variant="secondary" className="text-[10px]">
                                                            System Default
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="default" className="text-[10px]">
                                                            Custom
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground break-all font-mono">
                                                    {feed.url}
                                                </p>
                                            </div>

                                            {canDelete && (
                                                <div className="flex items-center gap-1 shrink-0 self-start sm:self-auto">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="hover:bg-accent gap-1 text-xs"
                                                        onClick={() => openEditFeedModal(feed)}
                                                        disabled={isPending}
                                                    >
                                                        <Edit3 className="h-3.5 w-3.5" />
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive hover:bg-destructive/10 gap-1 text-xs"
                                                        onClick={() => handleDeleteFeed(feed.id)}
                                                        disabled={isPending}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        Remove
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>

                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Article Full Reader Sheet / Modal */}
            <Sheet open={!!readingArticle} onOpenChange={open => !open && setReadingArticle(null)}>
                <SheetContent side="right" className="sm:max-w-2xl w-full p-0 flex flex-col h-full">
                    {readingArticle && (
                        <>
                            <SheetHeader className="p-6 pb-4 border-b shrink-0">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    {readingArticle.sourceTitle && (
                                        <Badge variant="secondary" className="text-xs">
                                            {readingArticle.sourceTitle}
                                        </Badge>
                                    )}
                                    {(readingArticle as any).category && (
                                        <Badge variant="outline" className="text-xs">
                                            {(readingArticle as any).category}
                                        </Badge>
                                    )}
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {formatDate(readingArticle.pubDate)}
                                    </span>
                                </div>
                                <SheetTitle className="text-xl sm:text-2xl font-bold leading-snug">
                                    {readingArticle.title}
                                </SheetTitle>
                            </SheetHeader>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {readingArticle.imageUrl && (
                                    <div className="rounded-xl overflow-hidden bg-muted border">
                                        <img
                                            src={getImageProxyUrl(readingArticle.imageUrl)}
                                            alt={readingArticle.title}
                                            referrerPolicy="no-referrer"
                                            className="w-full max-h-80 object-cover"
                                            onError={e => {
                                                (e.target as HTMLElement).style.display = "none"
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Article Sanitized Content */}
                                <div
                                    className="prose dark:prose-invert max-w-none text-foreground leading-relaxed text-sm sm:text-base space-y-4 [&_img]:rounded-lg [&_a]:text-primary [&_a]:underline"
                                    dangerouslySetInnerHTML={{
                                        __html: readingArticle.content || readingArticle.excerpt || ""
                                    }}
                                />

                                {/* Option to fetch and display full article body */}
                                <div className="p-4 rounded-xl border bg-muted/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left mt-6">
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-medium text-foreground">Read full article in Odyssi</p>
                                        <p className="text-xs text-muted-foreground">Fetch and parse original article content directly from website.</p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => handleFetchFullArticle(readingArticle)}
                                        disabled={isLoadingFullArticle}
                                        className="shrink-0 gap-1.5"
                                    >
                                        {isLoadingFullArticle ? (
                                            <>
                                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                                Loading Full Article...
                                            </>
                                        ) : (
                                            <>
                                                <Globe className="h-3.5 w-3.5" />
                                                Load Full Article
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>


                            <div className="p-4 border-t bg-muted/30 flex items-center justify-between shrink-0">
                                <Button
                                    variant={isSaved(readingArticle.link) ? "secondary" : "outline"}
                                    size="sm"
                                    onClick={() => handleSaveToggle(readingArticle)}
                                    className="gap-2"
                                >
                                    {isSaved(readingArticle.link) ? (
                                        <>
                                            <BookmarkCheck className="h-4 w-4 text-primary fill-primary" />
                                            Saved
                                        </>
                                    ) : (
                                        <>
                                            <Bookmark className="h-4 w-4" />
                                            Save for Later
                                        </>
                                    )}
                                </Button>

                                <Button size="sm" asChild className="gap-2">
                                    <a
                                        href={readingArticle.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Read on Source
                                        <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                </Button>
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    )
}
