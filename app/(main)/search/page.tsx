import { SearchUI } from "@/components/search/search-ui"

export default function SearchPage() {
    return (
        <div className="max-w-3xl mx-auto py-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Search</h1>
                <p className="text-muted-foreground">Find specific memories, thoughts, and moments.</p>
            </div>

            <SearchUI />
        </div>
    )
}
