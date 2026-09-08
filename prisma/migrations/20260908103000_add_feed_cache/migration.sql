-- CreateTable FeedArticleCache
CREATE TABLE IF NOT EXISTS "FeedArticleCache" (
    "id" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "excerpt" TEXT,
    "imageUrl" TEXT,
    "sourceTitle" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "category" TEXT DEFAULT 'General',
    "pubDate" TIMESTAMP(3),
    "author" TEXT,
    "feedId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedArticleCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "FeedArticleCache_link_key" ON "FeedArticleCache"("link");
CREATE INDEX IF NOT EXISTS "FeedArticleCache_sourceUrl_idx" ON "FeedArticleCache"("sourceUrl");
CREATE INDEX IF NOT EXISTS "FeedArticleCache_pubDate_idx" ON "FeedArticleCache"("pubDate");
