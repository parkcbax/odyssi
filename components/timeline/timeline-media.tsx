import { useState, useEffect, useRef, useMemo } from "react"
import { ImageWithLoader } from "@/components/ui/image-with-loader"
import { Image as ImageIcon, Loader2 } from "lucide-react"

interface TimelineMediaProps {
    entries: any[]
}

export function TimelineMedia({ entries }: TimelineMediaProps) {
    const [page, setPage] = useState(1);
    const itemsPerPage = 24;
    const observerTarget = useRef<HTMLDivElement>(null);

    // Flatten all images from entries with high fidelity de-duplication
    const allMedia = useMemo(() => {
        const mediaList: any[] = [];
        const seenUrls = new Set<string>();

        entries.forEach(entry => {
            const entryMedia: string[] = [];
            
            // 1. Collect from Asset relation
            if (entry.images && entry.images.length > 0) {
                entry.images.forEach((img: any) => entryMedia.push(img.url));
            }
            
            // 2. Collect from extracted contentImages
            if (entry.contentImages && entry.contentImages.length > 0) {
                entry.contentImages.forEach((url: string) => entryMedia.push(url));
            }
            
            // 3. Collect from fallback firstImage
            if (entry.firstImage) {
                entryMedia.push(entry.firstImage);
            }

            // Deduplicate for this entry and add
            entryMedia.forEach(url => {
                if (url && !seenUrls.has(url)) {
                    seenUrls.add(url);
                    mediaList.push({
                        url,
                        entryId: entry.id,
                        entryTitle: entry.title,
                        date: entry.date
                    });
                }
            });
        });

        return mediaList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [entries]);

    const displayedMedia = allMedia.slice(0, page * itemsPerPage);
    const hasMore = allMedia.length > displayedMedia.length;

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore) {
                    setPage(prev => prev + 1);
                }
            },
            { threshold: 0.1, rootMargin: '200px' }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [hasMore]);

    if (allMedia.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border-2 border-dashed rounded-3xl bg-muted/30 animate-in fade-in duration-700">
                <ImageIcon className="h-12 w-12 mb-4 opacity-20" />
                <p className="text-lg font-medium">No media found</p>
                <p className="text-sm opacity-60">Photos and videos from your entries will appear here.</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                {displayedMedia.map((item, index) => (
                    <a 
                        key={`${item.entryId}-${index}`}
                        href={`/entries/${item.entryId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative aspect-square overflow-hidden rounded-2xl bg-muted ring-offset-background transition-all hover:ring-2 hover:ring-primary hover:ring-offset-2"
                    >
                        <ImageWithLoader
                            src={item.url}
                            alt={item.entryTitle}
                            containerClassName="h-full w-full"
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        />
                        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                            <p className="text-xs text-white font-medium line-clamp-1">{item.entryTitle}</p>
                            <p className="text-[10px] text-white/70">
                                {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                        </div>
                    </a>
                ))}
            </div>
            
            <div ref={observerTarget} className="flex justify-center pt-4 pb-12">
                {hasMore && (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground animate-pulse">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span className="text-xs font-medium">Loading more treasures...</span>
                    </div>
                )}
                {!hasMore && allMedia.length > itemsPerPage && (
                    <p className="text-xs text-muted-foreground opacity-50 italic">
                        You've reached the beginning of your journey.
                    </p>
                )}
            </div>
        </div>
    )
}
