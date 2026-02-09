import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateBackup } from "@/app/lib/backup-service"

export async function GET(req: NextRequest) {
    try {
        const config = await prisma.appConfig.findFirst()

        if (!config || !config.enableAutoBackup) {
            return NextResponse.json({ message: "Auto backup disabled", skipped: true })
        }

        const now = new Date()
        const lastBackup = config.lastAutoBackupAt ? new Date(config.lastAutoBackupAt) : null

        let shouldBackup = false

        if (!lastBackup) {
            shouldBackup = true
        } else {
            const interval = config.autoBackupInterval
            const diff = now.getTime() - lastBackup.getTime()
            const oneDay = 24 * 60 * 60 * 1000

            // Logic for intervals
            switch (interval) {
                case "1Day":
                    if (diff > 1 * oneDay) shouldBackup = true;
                    break;
                case "1Week":
                    if (diff > 7 * oneDay) shouldBackup = true;
                    break;
                case "1Month":
                    // Approx 30 days
                    if (diff > 30 * oneDay) shouldBackup = true;
                    break;
                case "6Month":
                    if (diff > 180 * oneDay) shouldBackup = true;
                    break;
                case "1Year":
                    if (diff > 365 * oneDay) shouldBackup = true;
                    break;
                default:
                    // Default to 1 week if unknown
                    if (diff > 7 * oneDay) shouldBackup = true;
            }
        }

        if (shouldBackup) {
            console.log("Starting Auto Backup...")

            // Backup EVERYTHING for the system
            const result = await generateBackup({
                type: "EVERYTHING",
                source: "AUTO",
                // No userId means system-wide/all users
            })

            // Update last backup timestamp
            await prisma.appConfig.update({
                where: { id: config.id },
                data: { lastAutoBackupAt: now }
            })

            return NextResponse.json({
                message: "Auto backup completed",
                filename: result.filename
            })
        }

        return NextResponse.json({ message: "Backup not due yet", skipped: true })

    } catch (error: any) {
        console.error("Auto backup execution error:", error)
        return NextResponse.json({ error: error.message || "Auto backup failed" }, { status: 500 })
    }
}
