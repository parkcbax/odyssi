-- AlterTable
ALTER TABLE "Entry" ADD COLUMN     "mood" TEXT,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publicSlug" TEXT,
ADD COLUMN     "publicPassword" TEXT,
ADD COLUMN     "publicExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Entry_publicSlug_key" ON "Entry"("publicSlug");

-- AlterTable
ALTER TABLE "Journal" ADD COLUMN     "color" TEXT NOT NULL DEFAULT '#718982',
ADD COLUMN     "icon" TEXT,
ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT,
    "content" JSONB,
    "excerpt" TEXT,
    "featuredImage" TEXT,
    "keywords" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
