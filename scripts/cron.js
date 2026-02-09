
const fetch = require('node-fetch'); // Ensure node-fetch is available or use built-in fetch in Node 18+

// Configuration
const CRON_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
const API_URL = process.env.NEXTAUTH_URL
    ? `${process.env.NEXTAUTH_URL}/api/cron/backup`
    : 'http://localhost:3000/api/cron/backup';

console.log(`[Cron] Starting backup cron job...`);
console.log(`[Cron] Target: ${API_URL}`);
console.log(`[Cron] Interval: ${CRON_INTERVAL_MS / 1000 / 60} minutes`);

async function triggerBackup() {
    try {
        console.log(`[Cron] Triggering backup check at ${new Date().toISOString()}...`);
        const res = await fetch(API_URL);

        if (res.ok) {
            const data = await res.json();
            console.log(`[Cron] Success:`, data);
        } else {
            const text = await res.text();
            console.error(`[Cron] Failed (${res.status}):`, text);
        }
    } catch (error) {
        console.error(`[Cron] Error triggering backup:`, error.message);
    }
}

// Initial run after 1 minute (give app time to start)
setTimeout(() => {
    triggerBackup();
    // Then schedule periodic
    setInterval(triggerBackup, CRON_INTERVAL_MS);
}, 60 * 1000);
