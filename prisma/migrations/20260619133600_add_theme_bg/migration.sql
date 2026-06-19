-- AlterTable
ALTER TABLE "AppConfig" ADD COLUMN "themeBg" TEXT NOT NULL DEFAULT 'white',
ADD COLUMN "themeCustomBg" TEXT NOT NULL DEFAULT '#ffffff';
