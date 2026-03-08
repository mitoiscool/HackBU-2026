export function FallbackResult({ data }: { data: Record<string, unknown> }) {
    return (
        <pre className="rounded-lg bg-background/60 border border-border px-3 py-2 text-xs font-mono text-foreground leading-relaxed overflow-x-auto">
            {JSON.stringify(data, null, 2)}
        </pre>
    )
}
