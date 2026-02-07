"use client"

import { useEffect, useRef } from "react"

interface AnalyticsInjectorProps {
    snippet: string
}

export function AnalyticsInjector({ snippet }: AnalyticsInjectorProps) {
    const injectedRef = useRef(false)

    useEffect(() => {
        if (!snippet || injectedRef.current) return

        try {
            // Create a range to parse the HTML string
            const range = document.createRange()
            range.setStart(document.head, 0)
            const fragment = range.createContextualFragment(snippet)
            document.head.appendChild(fragment)
            injectedRef.current = true
        } catch (error) {
            console.error("Failed to inject analytics snippet:", error)
        }
    }, [snippet])

    return null
}
