"use client"

import { useState, useCallback, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { SearchResult, searchEntries } from "@/app/lib/actions-search"
import { Search as SearchIcon, Loader2, FileText, Calendar } from "lucide-react"
import Link from "next/link"
import { useDebouncedCallback } from "use-debounce"

export function SearchUI() {
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<SearchResult[]>([])
    const [isPending, startTransition] = useTransition()
    const [hasSearched, setHasSearched] = useState(false)

    const handleSearch = useDebouncedCallback((term: string) => {
        if (!term.trim()) {
            setResults([])
            setHasSearched(false)
            return
        }

        startTransition(async () => {
            const data = await searchEntries(term)
            setResults(data)
            setHasSearched(true)
        })
    }, 500)

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value
        setQuery(term)
        handleSearch(term)
    }

    // Function to highlight text
    const Highlight = ({ text, highlight }: { text: string, highlight: string }) => {
        if (!highlight.trim()) {
            return <span>{text}</span>
        }
        const parts = text.split(new RegExp(`(${highlight})`, 'gi'))
        return (
            <span>
                {parts.map((part, i) =>
                    part.toLowerCase() === highlight.toLowerCase() ? (
                        <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded-sm px-0.5 text-inherit">
                            {part}
                        </mark>
                    ) : (
                        part
                    )
                )}
            </span>
        )
    }

    return (
        <div className="space-y-6">
            <div className="relative">
                <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search entries..."
                    className="pl-9 h-12 text-lg"
                    value={query}
                    onChange={onInputChange}
                    autoFocus
                />
                {isPending && (
                    <div className="absolute right-3 top-3">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                )}
            </div>

            <div className="space-y-4">
                {!isPending && hasSearched && results.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground border rounded-lg bg-muted/20">
                        <SearchIcon className="h-10 w-10 mx-auto mb-2 opacity-20" />
                        <p>No matches found for "{query}"</p>
                    </div>
                )}

                {results.map((result) => (
                    <Link
                        key={result.id}
                        href={`/entries/${result.id}`}
                        className="block group"
                    >
                        <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors bg-card space-y-2">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                                    <Highlight text={result.title} highlight={query} />
                                </h3>
                                <div className="flex items-center text-xs text-muted-foreground gap-3">
                                    <div className="flex items-center gap-1">
                                        <div
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: result.journal.color }}
                                        />
                                        <span>{result.journal.title}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(result.date).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>

                            {result.snippet && (
                                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                    <Highlight text={result.snippet} highlight={query} />
                                </p>
                            )}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}
