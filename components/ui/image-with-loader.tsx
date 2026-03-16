"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface ImageWithLoaderProps extends Omit<React.ComponentProps<typeof Image>, 'onLoad'> {
    containerClassName?: string
}

export function ImageWithLoader({ className, containerClassName, alt, src, unoptimized, ...props }: ImageWithLoaderProps) {
    const [isLoading, setIsLoading] = useState(true)

    // Automatically bypass optimization for local images with special characters that break Next.js internal fetcher
    // '@' is often interpreted as userinfo in internal fetch URLs, causing "null" resource errors.
    const shouldBypassOptimization = typeof src === 'string' && (src.includes('@') || src.startsWith('http') || src.startsWith('data:'));

    return (
        <div className={cn("relative overflow-hidden", containerClassName)}>
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/50 backdrop-blur-sm z-10">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            )}
            <Image
                src={src}
                alt={alt}
                className={className}
                onLoad={() => setIsLoading(false)}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                unoptimized={unoptimized || shouldBypassOptimization}
                {...props}
            />
        </div>
    )
}
