"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageWithLoaderProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    containerClassName?: string
}

export function ImageWithLoader({ className, containerClassName, alt, ...props }: ImageWithLoaderProps) {
    const [isLoading, setIsLoading] = useState(true)

    return (
        <div className={cn("relative overflow-hidden", containerClassName)}>
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/50 backdrop-blur-sm z-10">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            )}
            <img
                className={cn(
                    "transition-opacity duration-300",
                    isLoading ? "opacity-0" : "opacity-100",
                    className
                )}
                alt={alt || "Image"}
                onLoad={() => setIsLoading(false)}
                {...props}
            />
        </div>
    )
}
