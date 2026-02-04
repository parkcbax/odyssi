export default function TimelinePage() {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Timeline</h1>
            </div>
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center text-muted-foreground min-h-[400px]">
                <p>Your timeline of memories will appear here.</p>
            </div>
        </div>
    )
}
