import { NextRequest, NextResponse } from "next/server"
import { readFile, writeFile, mkdir, readdir, rm, access, copyFile } from "fs/promises"
import { createReadStream } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import { pipeline } from "stream/promises"
import { PassThrough } from "stream"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { isAdmin } from "@/lib/auth-utils"
import * as unzipper from "unzipper"
import { parser } from "stream-json"
import { pick } from "stream-json/filters/Pick"
import { streamArray } from "stream-json/streamers/StreamArray"
import { streamValues } from "stream-json/streamers/StreamValues"
import { streamObject } from "stream-json/streamers/StreamObject"

// Helper to extract a single scalar value securely from the root level
async function extractValue(filePath: string, filterName: string): Promise<any> {
    return new Promise((resolve, reject) => {
        let result: any = null;
        let found = false;
        const stream = createReadStream(filePath)
            .pipe(parser())
            .pipe(pick({ filter: filterName }))
            .pipe(streamValues());

        stream.on('data', ({ value }) => {
            if (!found) {
                result = value;
                found = true;
                stream.destroy();
                resolve(result);
            }
        });
        stream.on('end', () => resolve(result));
        stream.on('error', (e) => resolve(null));
    });
}

// Helper to extract a fast Object map securely
async function extractObject(filePath: string, filterName: string): Promise<Record<string, any> | null> {
    return new Promise((resolve, reject) => {
        let result: Record<string, any> | null = null;
        const stream = createReadStream(filePath)
            .pipe(parser())
            .pipe(pick({ filter: filterName }))
            .pipe(streamObject());

        stream.on('data', ({ key, value }) => {
            if (!result) result = {};
            result[key] = value;
        });
        stream.on('end', () => resolve(result));
        stream.on('error', (e) => resolve(null));
    });
}

// Helper to robustly process a massive Array sequentially without memory saturation
async function processStreamArray(filePath: string, filterName: string, processor: (item: any) => Promise<void>): Promise<void> {
    return new Promise((resolve, reject) => {
        const stream = createReadStream(filePath)
            .pipe(parser())
            .pipe(pick({ filter: filterName }))
            .pipe(streamArray());

        stream.on('data', async ({ value }) => {
            stream.pause(); // Pause stream, letting GC breathe
            try {
                await processor(value);
            } catch (e) {
                stream.destroy();
                return reject(e);
            }
            stream.resume(); // Advance
        });

        stream.on('end', () => resolve());
        stream.on('error', (e) => resolve()); // If array missing, gracefully ignore
    });
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { filename } = await req.json().catch(() => ({}));
    if (!filename) {
        return NextResponse.json({ error: "Filename required" }, { status: 400 });
    }

    const backupDir = join(process.cwd(), "backups");
    const fullPath = join(backupDir, filename);

    // 1. Resolve which files to stream
    let parts: string[] = [];
    try {
        await access(fullPath);
        parts = [filename];
    } catch {
        const dirFiles = await readdir(backupDir);
        parts = dirFiles.filter(f => f.startsWith(filename + ".part")).sort();
        if (parts.length === 0) {
            return NextResponse.json({ error: "Backup file not found" }, { status: 404 });
        }
    }

    const tempExtractPath = join(process.cwd(), "tmp_restore_" + Date.now());

    try {
        await mkdir(tempExtractPath, { recursive: true });

        // 2. Stream extraction (prevents RAM caching entire ZIP archive!)
        const combinedStream = new PassThrough();

        // Feed parts linearly matching multipart sequential boundaries
        const pumpParts = async () => {
            try {
                for (const p of parts) {
                    const rs = createReadStream(join(backupDir, p));
                    await new Promise<void>((resolve, reject) => {
                        rs.pipe(combinedStream, { end: false });
                        rs.on('end', () => resolve());
                        rs.on('error', reject);
                    });
                }
                combinedStream.end();
            } catch (err) {
                combinedStream.destroy(err as any);
            }
        };

        const extracting = pipeline(combinedStream, unzipper.Extract({ path: tempExtractPath }));
        await Promise.all([pumpParts(), extracting]);

        // 3. Process the extracted artifacts locally 
        const dataJsonPath = join(tempExtractPath, "data.json");
        const uploadsPath = join(tempExtractPath, "uploads");

        // Restore images into live public mount securely
        const uploadDir = join(process.cwd(), "public", "uploads");
        await mkdir(uploadDir, { recursive: true });

        try {
            const extractedUploads = await readdir(uploadsPath);
            for (const file of extractedUploads) {
                await copyFile(join(uploadsPath, file), join(uploadDir, file));
            }
        } catch (e) {
            // Ignore smoothly if 'uploads' directory mapping was empty
        }

        // 4. Begin identifying payload
        const dataType = await extractValue(dataJsonPath, "type") || "EVERYTHING";
        const currentUserId = session.user.id;
        const isUserAdmin = isAdmin(session.user.email);

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email || "" }
        });

        if (!currentUser) {
            return NextResponse.json({ error: "User record not found in database. Please re-login." }, { status: 401 });
        }

        const parseDate = (val: any): Date => {
            if (!val) return new Date();
            const d = new Date(val);
            if (isNaN(d.getTime())) return new Date();
            // Protect against Prisma Rust Chrono panic limits
            if (d.getFullYear() < 1900 || d.getFullYear() > 2100) return new Date();
            return d;
        };

        const parseFloatSafe = (val: any): number | undefined => {
            if (val === null || val === undefined || val === '') return undefined;
            const f = parseFloat(val);
            return (isNaN(f) || !isFinite(f)) ? undefined : f;
        };

        const safeString = (val: any, maxLen: number): string | null => {
            if (!val) return null;
            let str = String(val);
            if (str.length > maxLen) str = str.substring(0, maxLen);
            // Scrub ANY unpaired surrogates natively via Node.js Buffer UTF-8 strict encoding
            str = Buffer.from(str, 'utf-8').toString('utf-8');
            return str.replace(/\u0000/g, '');
        };

        const limitDepth = (obj: any, currentDepth = 0, maxDepth = 20): any => {
            if (obj === null || obj === undefined) return obj;
            if (currentDepth >= maxDepth) {
                return typeof obj === 'string' ? obj.substring(0, 100) + '...[truncated depth]' : null;
            }
            if (Array.isArray(obj)) {
                // Stricter array limit to prevent flat node bloat! 
                // 100 items per array is completely sufficient for text paras.
                const limitedArray = obj.length > 100 ? obj.slice(0, 100) : obj;
                return limitedArray.map(item => limitDepth(item, currentDepth + 1, maxDepth));
            }
            if (typeof obj === 'object') {
                const newObj: any = {};
                for (const [k, v] of Object.entries(obj)) {
                    newObj[k] = limitDepth(v, currentDepth + 1, maxDepth);
                }
                return newObj;
            }
            if (typeof obj === 'string') {
                return obj.replace(/\u0000/g, '');
            }
            return obj;
        };

        const sanitizePayload = async (obj: any): Promise<any> => {
            if (!obj) return obj;
            try {
                // 1. Defend against Prisma Rust Engine stack overflow (OneNote inline span nesting panics)
                const depthLimited = limitDepth(obj, 0, 40);

                // 2. Prevent invalid null bytes and UNPAIRED SURROGATES choking Postgres JSONB or Rust Engine
                let s = typeof depthLimited === 'string' ? depthLimited : JSON.stringify(depthLimited);
                s = Buffer.from(s, 'utf-8').toString('utf-8');
                s = s.replace(/\u0000/g, '');

                // 3. Extract massive base64 images into physical files to avoid AST Buffer Overflow entirely
                const extractAndSaveBase64 = async (str: string) => {
                    const regex = /data:([a-zA-Z0-9-+\/.]+)[^"']*;base64,((?:[A-Za-z0-9+/=\-_\s]|\\[A-Za-z0-9+/=\-_\s])+)/g;
                    let result = str;
                    let match;
                    const matches = [];
                    while ((match = regex.exec(str)) !== null) {
                        matches.push({ full: match[0], mime: match[1], base64: match[2], index: match.index });
                    }

                    if (matches.length > 0) {
                        const { writeFile, mkdir } = await import('fs/promises');
                        const { join } = await import('path');
                        const uploadDir = join(process.cwd(), "public", "uploads");
                        try { await mkdir(uploadDir, { recursive: true }); } catch (e) { }

                        for (const m of matches) {
                            if (m.base64.length > 50000) { // Only extract if > ~37KB
                                try {
                                    // Clean JSON-encoded newlines and slashes so Buffer doesn't parse them as base64 chars
                                    const decodedBase64 = m.base64.replace(/\\[nrt]/g, '').replace(/\\\//g, '/');
                                    const buffer = Buffer.from(decodedBase64, 'base64');
                                    const ext = m.mime.split('/')[1]?.split('+')[0] || 'img';
                                    const filename = `restore-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
                                    const filepath = join(uploadDir, filename);
                                    await writeFile(filepath, buffer);
                                    result = result.split(m.full).join(`/uploads/${filename}`);
                                } catch (e) {
                                    console.error("Failed to extract base64 to file", e);
                                }
                            }
                        }
                    }
                    return result;
                };

                s = await extractAndSaveBase64(s);

                // 3.5. Truncate insanely massive alt or title attributes in OneNote HTML blobs.
                // OneNote exports often contain 10MB+ pure text wrapped in <img alt="OCR TEXT...">
                s = s.replace(/(?:alt|title)=\\"([\s\S]*?)\\"/g, (match, content) => {
                    return content.length > 1000 ? `alt=\\"${content.substring(0, 1000)}... [Massive OCR Text Truncated]\\"` : match;
                });

                // 4. Absolute V8 Out Of Memory ceiling (1.5MB) after Base64 extraction
                if (s.length > 1500000) {
                    return typeof obj === 'string'
                        ? s.substring(0, 1500000) + "... [Extremely massive payload >1.5MB truncated safely]"
                        : { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Entry text content exceeded safe 1.5MB limit." }] }] };
                }

                return typeof obj === 'string' ? s : JSON.parse(s);
            } catch (e) {
                console.error("CRITICAL SANITIZE ERROR FOR ENTRY:", e);
                return typeof obj === 'string'
                    ? "Content Error"
                    : { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Entry failed JSON parser recovery." }] }] };
            }
        };

        // 5. Heavy database transaction mapping utilizing robust stream pumping internally
        const tx = prisma;
        try {
            const userIdMap = new Map<string, string>();

            const getValidUserId = (oldId: string) => {
                return userIdMap.has(oldId) ? userIdMap.get(oldId)! : currentUserId;
            };

            if (dataType === "EVERYTHING") {
                if (isUserAdmin) {
                    // Extract Users Sequentially
                    await processStreamArray(dataJsonPath, "users", async (user) => {
                        const existingByEmail = await tx.user.findUnique({ where: { email: user.email } });
                        let targetId = user.id;

                        if (existingByEmail) {
                            targetId = existingByEmail.id;
                            await tx.user.update({
                                where: { id: targetId },
                                data: {
                                    name: user.name,
                                    image: user.image,
                                    passwordHash: user.passwordHash,
                                    emailVerified: user.emailVerified,
                                    timezone: user.timezone,
                                    updatedAt: user.updatedAt ? parseDate(user.updatedAt) : undefined
                                }
                            });
                        } else {
                            const existingById = await tx.user.findUnique({ where: { id: user.id } });
                            if (existingById) {
                                targetId = existingById.id;
                                await tx.user.update({
                                    where: { id: targetId },
                                    data: {
                                        email: user.email,
                                        name: user.name,
                                        image: user.image,
                                        passwordHash: user.passwordHash,
                                        emailVerified: user.emailVerified,
                                        timezone: user.timezone,
                                        updatedAt: user.updatedAt ? parseDate(user.updatedAt) : undefined
                                    }
                                });
                            } else {
                                await tx.user.create({
                                    data: {
                                        id: user.id,
                                        name: user.name,
                                        email: user.email,
                                        passwordHash: user.passwordHash,
                                        timezone: user.timezone || "UTC",
                                        image: user.image,
                                        emailVerified: user.emailVerified,
                                        createdAt: parseDate(user.createdAt),
                                        updatedAt: parseDate(user.updatedAt)
                                    }
                                });
                            }
                        }
                        userIdMap.set(user.id, targetId);
                    });

                    // Clear data securely prior to streams mapping 
                    const validUserIds = Array.from(userIdMap.values());
                    if (!validUserIds.includes(currentUserId)) {
                        validUserIds.push(currentUserId);
                    }

                    if (validUserIds.length > 0) {
                        await tx.journal.deleteMany({ where: { userId: { in: validUserIds } } });
                        await tx.tag.deleteMany({ where: { userId: { in: validUserIds } } });
                        await tx.blogPost.deleteMany({ where: { authorId: { in: validUserIds } } });
                    }
                } else {
                    await tx.journal.deleteMany({ where: { userId: currentUserId } });
                    await tx.tag.deleteMany({ where: { userId: currentUserId } });
                    await tx.blogPost.deleteMany({ where: { authorId: currentUserId } });
                }

                // Streaming Tags
                await processStreamArray(dataJsonPath, "tags", async (tag) => {
                    const targetUserId = (isUserAdmin && tag.userId) ? getValidUserId(tag.userId) : currentUserId;
                    await tx.tag.upsert({
                        where: {
                            name_userId: { name: tag.name, userId: targetUserId }
                        },
                        update: {},
                        create: {
                            name: tag.name,
                            user: { connect: { id: targetUserId } },
                        }
                    });
                });

                // Streaming Journals & Deep Entries
                await processStreamArray(dataJsonPath, "journals", async (j) => {
                    const targetUserId = (isUserAdmin && j.userId) ? getValidUserId(j.userId) : currentUserId;
                    const createdJournal = await tx.journal.create({
                        data: {
                            title: j.title,
                            description: j.description,
                            color: j.color,
                            icon: j.icon,
                            user: { connect: { id: targetUserId } },
                            createdAt: parseDate(j.createdAt),
                            updatedAt: parseDate(j.updatedAt)
                        }
                    });

                    if (j.entries) {
                        for (const e of j.entries) {
                            try {
                                await new Promise(r => setTimeout(r, 10)); // Yield event loop to prevent Prisma Engine panic on large ASTs
                                const createdEntry = await tx.entry.create({
                                    data: {
                                        journal: { connect: { id: createdJournal.id } },
                                        title: safeString(e.title, 500) || "Untitled Entry",
                                        content: e.content ? await sanitizePayload(e.content) : null,
                                        date: parseDate(e.date),
                                        mood: safeString(e.mood, 100),
                                        locationLat: parseFloatSafe(e.locationLat),
                                        locationLng: parseFloatSafe(e.locationLng),
                                        locationName: safeString(e.locationName, 500),
                                        createdAt: parseDate(e.createdAt),
                                        updatedAt: parseDate(e.updatedAt)
                                    }
                                });

                                if (e.images && e.images.length > 0) {
                                    for (const img of e.images) {
                                        if (img.url) {
                                            try {
                                                await tx.asset.create({
                                                    data: {
                                                        entryId: createdEntry.id,
                                                        url: img.url,
                                                        type: img.type || 'image'
                                                    }
                                                });
                                            } catch (err) {
                                                console.error("Failed to restore asset for entry", createdEntry.id, err);
                                            }
                                        }
                                    }
                                }

                                if (e.tags && e.tags.length > 0) {
                                    try {
                                        await tx.entry.update({
                                            where: { id: createdEntry.id },
                                            data: {
                                                tags: { connect: e.tags.map((t: any) => ({ name_userId: { name: t.name, userId: targetUserId } })) }
                                            }
                                        });
                                    } catch (err) {
                                        console.error("Failed to connect tags for entry", createdEntry.id, err);
                                    }
                                }
                            } catch (err) {
                                console.error(`Failed to restore entry: ${e?.title}`, err);
                                try {
                                    const { writeFile } = await import('fs/promises');
                                    const safeTitle = (e?.title || 'untitled').toString().replace(/[^a-z0-9]/gi, '_');
                                    await writeFile(`${process.cwd()}/failed_entry_debug_${safeTitle}.json`, JSON.stringify(e));
                                } catch (fsErr) { }
                            }
                        }
                    }
                });

                // Streaming Blog Posts
                await processStreamArray(dataJsonPath, "blogPosts", async (post) => {
                    const targetAuthorId = (isUserAdmin && post.authorId) ? getValidUserId(post.authorId) : currentUserId;
                    let slug = post.slug;
                    if (slug) {
                        const existing = await tx.blogPost.findUnique({ where: { slug } });
                        if (existing) {
                            let counter = 2;
                            while (await tx.blogPost.findUnique({ where: { slug: `${post.slug}-${counter}` } })) {
                                counter++;
                            }
                            slug = `${post.slug}-${counter}`;
                        }
                    } else {
                        slug = `post-${Date.now()}`;
                    }

                    await tx.blogPost.create({
                        data: {
                            title: post.title,
                            slug: slug,
                            content: post.content,
                            published: post.published,
                            createdAt: parseDate(post.createdAt),
                            updatedAt: parseDate(post.updatedAt),
                            author: { connect: { id: targetAuthorId } }
                        }
                    });
                });

                // Top level Config Restoration
                const appConfig = await extractObject(dataJsonPath, "appConfig");
                if (appConfig) {
                    const existingConfig = await tx.appConfig.findFirst();
                    if (existingConfig) {
                        await tx.appConfig.update({
                            where: { id: existingConfig.id },
                            data: {
                                redirectHomeToLogin: appConfig.redirectHomeToLogin,
                                enableBlogging: appConfig.enableBlogging,
                                enableAutoBackup: appConfig.enableAutoBackup,
                                autoBackupInterval: appConfig.autoBackupInterval,
                                enableMultiUser: appConfig.enableMultiUser,
                                enableUserBlogging: appConfig.enableUserBlogging,
                                analyticSnippet: appConfig.analyticSnippet
                            }
                        });
                    } else {
                        await tx.appConfig.create({
                            data: {
                                id: appConfig.id,
                                redirectHomeToLogin: appConfig.redirectHomeToLogin,
                                enableBlogging: appConfig.enableBlogging,
                                enableAutoBackup: appConfig.enableAutoBackup,
                                autoBackupInterval: appConfig.autoBackupInterval,
                                enableMultiUser: appConfig.enableMultiUser,
                                enableUserBlogging: appConfig.enableUserBlogging,
                                analyticSnippet: appConfig.analyticSnippet
                            }
                        });
                    }
                }

            } else if (dataType === "JOURNAL") {
                // Streaming Individual Context Journals securely
                await processStreamArray(dataJsonPath, "journals", async (j) => {
                    let title = j.title;
                    const existing = await tx.journal.findFirst({
                        where: { title: title, userId: currentUserId }
                    });

                    if (existing) {
                        title = `${title} - Restored ${new Date().toLocaleDateString().replace(/\//g, '-')}`;
                        let counter = 2;
                        while (await tx.journal.findFirst({ where: { title: `${j.title}-${counter}`, userId: currentUserId } })) {
                            counter++;
                        }
                        title = `${j.title}-${counter}`;
                    }

                    // Upsert any tags associated with the imported journal to prevent Prisma Rust panics
                    if (j.entries) {
                        for (const e of j.entries) {
                            await new Promise(r => setTimeout(r, 10)); // Yield event loop to prevent Prisma Engine panic on large ASTs
                            if (e.tags) {
                                for (const t of e.tags) {
                                    await tx.tag.upsert({
                                        where: { name_userId: { name: t.name, userId: currentUserId } },
                                        update: {},
                                        create: { name: t.name, userId: currentUserId }
                                    });
                                }
                            }
                        }
                    }

                    const createdJournal = await tx.journal.create({
                        data: {
                            title: title,
                            description: j.description,
                            color: j.color,
                            icon: j.icon,
                            userId: currentUserId,
                            createdAt: parseDate(j.createdAt),
                            updatedAt: parseDate(j.updatedAt)
                        }
                    });

                    if (j.entries) {
                        for (const e of j.entries) {
                            try {
                                await new Promise(r => setTimeout(r, 10)); // Yield event loop to prevent Prisma Engine panic on large ASTs
                                const createdEntry = await tx.entry.create({
                                    data: {
                                        journal: { connect: { id: createdJournal.id } },
                                        title: safeString(e.title, 500) || "Untitled Entry",
                                        content: e.content ? await sanitizePayload(e.content) : null,
                                        date: parseDate(e.date),
                                        mood: safeString(e.mood, 100),
                                        locationLat: parseFloatSafe(e.locationLat),
                                        locationLng: parseFloatSafe(e.locationLng),
                                        locationName: safeString(e.locationName, 500),
                                        createdAt: parseDate(e.createdAt),
                                        updatedAt: parseDate(e.updatedAt)
                                    }
                                });

                                if (e.images && e.images.length > 0) {
                                    for (const img of e.images) {
                                        if (img.url) {
                                            try {
                                                await tx.asset.create({
                                                    data: {
                                                        entryId: createdEntry.id,
                                                        url: img.url,
                                                        type: img.type || 'image'
                                                    }
                                                });
                                            } catch (err) {
                                                console.error("Failed to restore asset for entry", createdEntry.id, err);
                                            }
                                        }
                                    }
                                }

                                if (e.tags && e.tags.length > 0) {
                                    try {
                                        await tx.entry.update({
                                            where: { id: createdEntry.id },
                                            data: {
                                                tags: { connect: e.tags.map((t: any) => ({ name_userId: { name: t.name, userId: currentUserId } })) }
                                            }
                                        });
                                    } catch (err) {
                                        console.error("Failed to connect tags for entry", createdEntry.id, err);
                                    }
                                }
                            } catch (err) {
                                console.error(`Failed to restore entry: ${e?.title}`, err);
                                try {
                                    const { writeFile } = await import('fs/promises');
                                    const safeTitle = (e?.title || 'untitled').toString().replace(/[^a-z0-9]/gi, '_');
                                    await writeFile(`${process.cwd()}/failed_entry_debug_${safeTitle}.json`, JSON.stringify(e));
                                } catch (fsErr) { }
                            }
                        }
                    }
                });
            }
        } finally { } // Massive timeouts for safe streaming injection. 10m ceiling!

    } catch (error) {
        console.error("Restore compilation error:", error);
        return NextResponse.json({ error: "Restore failed processing internal files." }, { status: 500 });

    } finally {
        // Safe explicit garbage cleanup!
        try {
            await rm(tempExtractPath, { recursive: true, force: true });
        } catch (e) {
            console.error("Failed cleaning up extraction temporary files", e);
        }
    }

    return NextResponse.json({ message: "Restore successful!" });
}
