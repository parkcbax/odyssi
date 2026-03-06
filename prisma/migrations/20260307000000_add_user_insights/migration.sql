-- AlterTable
ALTER TABLE "User" ADD COLUMN     "insightsData" JSONB,
ADD COLUMN     "insightsUpdatedAt" TIMESTAMP(3);
