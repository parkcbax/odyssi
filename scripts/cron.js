// Configuration
const CRON_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const BACKUP_API_URL = `${BASE_URL}/api/cron/backup`;
const NEWS_API_URL = `${BASE_URL}/api/cron/news`;

console.log(`[Cron] Starting background cron jobs...`);
console.log(`[Cron] Target Base: ${BASE_URL}`);
console.log(`[Cron] Interval: ${CRON_INTERVAL_MS / 1000 / 60} minutes`);

async function triggerCronJobs() {
    const headers = {};
    if (process.env.CRON_SECRET) {
        headers['x-cron-secret'] = process.env.CRON_SECRET;
    }

    // 1. Backup Cron
    try {
        console.log(`[Cron] Triggering backup check at ${new Date().toISOString()}...`);
        const res = await fetch(BACKUP_API_URL, { headers });
        if (res.ok) {
            const data = await res.json();
            console.log(`[Cron Backup] Success:`, data);
        } else {
            const text = await res.text();
            console.error(`[Cron Backup] Failed (${res.status}):`, text);
        }
    } catch (error) {
        console.error(`[Cron Backup] Error:`, error.message);
    }

    // 2. RSS News Feeds Sync
    try {
        console.log(`[Cron] Triggering RSS news feed sync at ${new Date().toISOString()}...`);
        const res = await fetch(NEWS_API_URL, { headers });
        if (res.ok) {
            const data = await res.json();
            console.log(`[Cron News] Success:`, data);
        } else {
            const text = await res.text();
            console.error(`[Cron News] Failed (${res.status}):`, text);
        }
    } catch (error) {
        console.error(`[Cron News] Error:`, error.message);
    }
}

// Initial run after 1 minute (give app time to start)
setTimeout(() => {
    triggerCronJobs();
    // Then schedule periodic
    setInterval(triggerCronJobs, CRON_INTERVAL_MS);
}, 60 * 1000);

