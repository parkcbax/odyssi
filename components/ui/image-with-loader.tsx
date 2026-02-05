"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface ImageWithLoaderProps extends Omit<React.ComponentProps<typeof Image>, 'onLoad'> {
    containerClassName?: string
}

export function ImageWithLoader({ className, containerClassName, alt, src, ...props }: ImageWithLoaderProps) {
    const [isLoading, setIsLoading] = useState(true)

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
                {...props}
            />
        </div>
    )
}
