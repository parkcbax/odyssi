-- AlterTable
ALTER TABLE "AppConfig" ADD COLUMN "themeFont" TEXT NOT NULL DEFAULT 'inter',
ADD COLUMN "themeBlogFont" TEXT NOT NULL DEFAULT 'inter',
ADD COLUMN "themeBlogSize" TEXT NOT NULL DEFAULT 'medium',
ADD COLUMN "themeCodeFont" TEXT NOT NULL DEFAULT 'geist',
ADD COLUMN "themeAccent" TEXT NOT NULL DEFAULT 'sage',
ADD COLUMN "themeCustomAccent" TEXT NOT NULL DEFAULT '#768882';
