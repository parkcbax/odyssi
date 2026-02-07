# Odyssi

Odyssi is a minimalist, self-hosted sanctuary for your memories. Private, secure, and beautiful.

## Features

- **Private & Secure:** Self-hosted data ownership. No tracking, no ads.
- **Rich Text Editor:** Write beautiful entries with Tiptap editor support, including custom HTML and image controls.
- **Visual Calendar:** View your memories in a calendar view with photo thumbnails.
- **Multiple Journals:** Organize your life into different journals (e.g., Personal, Work, Travel).
- **Insights Dashboard:** diverse analytics including streaks, writing activity, and mood tracking.
- **Blogging:** Optional public blog to share selected thoughts with the world.
- **Media Cleanup:** Intelligent scouting of unreferenced media files to keep your storage clean, with detailed usage reporting.
- **Backup & Restore:** Securely export and import your data.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Database:** PostgreSQL with Prisma ORM
- **Auth:** NextAuth.js (v5)
- **UI:** Tailwind CSS, Shadcn architecture, Lucide icons
- **Deployment:** Docker & Docker Compose

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/parkcbax/odyssi.git
    cd odyssi
    ```

2.  **Environment Setup:**
    Copy `.env.example` to `.env` and fill in your database credentials and `NEXTAUTH_SECRET`.

3.  **Install Dependencies:**
    ```bash
    npm install
    ```

4.  **Database Migration & Seeding:**
    ```bash
    npx prisma migrate dev
    npx prisma db seed
    ```

5.  **Run Development Server:**
    ```bash
    npm run dev
    ```

## Default Credentials

For a fresh installation, the system seeds a default admin account:

- **Email:** `admin@odyssi.com` (or the value of `ADMIN_EMAIL` in `.env`)
- **Password:** `odyssi`

> [!IMPORTANT]
> Change your password immediately after the first login in **Settings > Profile**.

## Deployment

Use the included `docker-compose.yml` for easy deployment:

```bash
docker-compose up -d --build
```
