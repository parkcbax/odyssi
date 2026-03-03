"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"

interface JournalPaginationProps {
    journalId: string
    currentPage: number
    totalPages: number
}

export function JournalPagination({ journalId, currentPage, totalPages }: JournalPaginationProps) {
    const router = useRouter()

    if (totalPages <= 1) return null

    const handlePageChange = (page: string) => {
        router.push(`/journals/${journalId}?page=${page}`)
    }

    const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

    return (
        <div className="flex items-center gap-2">
            <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage <= 1}
                onClick={() => handlePageChange((currentPage - 1).toString())}
            >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous page</span>
            </Button>

            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Page</span>
                <Select
                    value={currentPage.toString()}
                    onValueChange={handlePageChange}
                >
                    <SelectTrigger className="h-8 w-[70px]">
                        <SelectValue placeholder={currentPage.toString()} />
                    </SelectTrigger>
                    <SelectContent>
                        {pages.map((p) => (
                            <SelectItem key={p} value={p.toString()}>
                                {p}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground whitespace-nowrap hidden sm:inline-block">of {totalPages}</span>
            </div>

            <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage >= totalPages}
                onClick={() => handlePageChange((currentPage + 1).toString())}
            >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next page</span>
            </Button>
        </div>
    )
}
