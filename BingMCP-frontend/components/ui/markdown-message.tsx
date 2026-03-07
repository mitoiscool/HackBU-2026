import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { Components } from "react-markdown"

const components: Components = {
    // Paragraphs
    p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,

    // Headings
    h1: ({ children }) => <h1 className="text-lg font-bold mt-4 mb-1 first:mt-0 text-foreground">{children}</h1>,
    h2: ({ children }) => <h2 className="text-base font-semibold mt-3 mb-1 first:mt-0 text-foreground">{children}</h2>,
    h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-0.5 first:mt-0 text-foreground">{children}</h3>,

    // Lists
    ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-0.5">{children}</ul>,
    ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-0.5">{children}</ol>,
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,

    // Inline code
    code: ({ children, className }) => {
        const isBlock = className?.startsWith("language-")
        if (isBlock) {
            return (
                <code className="block w-full overflow-x-auto rounded-lg bg-background/60 border border-border px-3.5 py-3 text-xs font-mono text-foreground leading-relaxed">
                    {children}
                </code>
            )
        }
        return (
            <code className="rounded px-1.5 py-0.5 text-[11px] font-mono bg-background/60 border border-border text-primary">
                {children}
            </code>
        )
    },

    // Code blocks
    pre: ({ children }) => (
        <pre className="mb-2 rounded-lg overflow-hidden text-xs">{children}</pre>
    ),

    // Blockquote
    blockquote: ({ children }) => (
        <blockquote className="mb-2 border-l-2 border-primary/40 pl-3 text-muted-foreground italic">
            {children}
        </blockquote>
    ),

    // Bold / italic
    strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
    em: ({ children }) => <em className="italic opacity-90">{children}</em>,

    // Horizontal rule
    hr: () => <hr className="my-3 border-border" />,

    // Tables (remark-gfm)
    table: ({ children }) => (
        <div className="mb-2 overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-xs">{children}</table>
        </div>
    ),
    thead: ({ children }) => <thead className="bg-muted/60">{children}</thead>,
    th: ({ children }) => (
        <th className="px-3 py-2 text-left font-semibold text-foreground border-b border-border">
            {children}
        </th>
    ),
    td: ({ children }) => (
        <td className="px-3 py-1.5 text-muted-foreground border-b border-border last:border-b-0">
            {children}
        </td>
    ),

    // Links
    a: ({ href, children }) => (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
        >
            {children}
        </a>
    ),
}

interface MarkdownMessageProps {
    content: string
}

export function MarkdownMessage({ content }: MarkdownMessageProps) {
    return (
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
            {content}
        </ReactMarkdown>
    )
}
