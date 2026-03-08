export interface ToolCallCardProps {
    toolName: string
    state: "call" | "partial-call" | "result"
    result?: unknown
    isVisualUnique?: boolean
}
