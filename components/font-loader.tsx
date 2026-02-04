"use client"

import { useEffect } from "react"

export function FontLoader() {
    useEffect(() => {
        const savedFont = localStorage.getItem("odyssi-font") || "inter"
        document.documentElement.setAttribute("data-font", savedFont)
    }, [])

    return null
}
