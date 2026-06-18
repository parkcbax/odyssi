"use client"

import { useEffect } from "react"

export function FontLoader() {
    useEffect(() => {
        const savedFont = localStorage.getItem("odyssi-font") || "inter"
        document.documentElement.setAttribute("data-font", savedFont)

        const savedBlogFont = localStorage.getItem("odyssi-blog-font") || "inter"
        document.documentElement.setAttribute("data-blog-font", savedBlogFont)

        const savedBlogSize = localStorage.getItem("odyssi-blog-size") || "medium"
        document.documentElement.setAttribute("data-blog-size", savedBlogSize)

        const savedCodeFont = localStorage.getItem("odyssi-code-font") || "geist"
        document.documentElement.setAttribute("data-code-font", savedCodeFont)

        const savedAccent = localStorage.getItem("odyssi-accent") || "sage"
        document.documentElement.setAttribute("data-accent", savedAccent)
    }, [])

    return null
}
