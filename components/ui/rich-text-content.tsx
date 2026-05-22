import { cn } from "@/lib/utils"

interface Props {
  html: string
  className?: string
}

export function RichTextContent({ html, className }: Props) {
  return (
    <div
      className={cn("prose prose-sm dark:prose-invert max-w-none", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
