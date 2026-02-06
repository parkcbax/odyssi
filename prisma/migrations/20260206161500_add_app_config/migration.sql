-- CreateTable
CREATE TABLE "AppConfig" (
    "id" TEXT NOT NULL,
    "redirectHomeToLogin" BOOLEAN NOT NULL DEFAULT false,
    "enableBlogging" BOOLEAN NOT NULL DEFAULT false,
    "enableAutoBackup" BOOLEAN NOT NULL DEFAULT false,
    "autoBackupInterval" TEXT NOT NULL DEFAULT '1Week',
    "lastAutoBackupAt" TIMESTAMP(3),
    "enableMultiUser" BOOLEAN NOT NULL DEFAULT false,
    "enableUserBlogging" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AppConfig_pkey" PRIMARY KEY ("id")
);
