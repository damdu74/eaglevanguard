"use client"

import { useEditor, EditorContent, type Editor } from "@tiptap/react"
import { BubbleMenu } from "@tiptap/react/menus"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import Placeholder from "@tiptap/extension-placeholder"
import { useCallback, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import data from "@emoji-mart/data"
import Picker from "@emoji-mart/react"
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Code, Quote, Link as LinkIcon, Image as ImageIcon, Smile,
} from "lucide-react"
import { useTheme } from "next-themes"

interface Props {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

async function uploadImage(file: File): Promise<string | null> {
  const formData = new FormData()
  formData.append("file", file)
  const res = await fetch("/api/upload/image", { method: "POST", body: formData })
  if (!res.ok) return null
  const { url } = await res.json() as { url: string }
  return url
}

async function insertImageFile(editor: Editor, file: File) {
  if (!file.type.startsWith("image/")) return
  const url = await uploadImage(file)
  if (url) editor.chain().focus().setImage({ src: url }).run()
}

function BubbleButton({
  onClick, active, title, children,
}: {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      title={title}
      className={cn(
        "p-1.5 rounded transition-colors text-sm",
        active ? "bg-white/20 text-white" : "text-white/80 hover:text-white hover:bg-white/10"
      )}
    >
      {children}
    </button>
  )
}

function ToolbarButton({
  onClick, active, title, children,
}: {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      title={title}
      className={cn(
        "p-2 rounded transition-colors",
        active ? "text-primary bg-muted" : "text-muted-foreground hover:text-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  )
}

export function RichTextEditor({ value, onChange, placeholder }: Props) {
  const { resolvedTheme } = useTheme()
  const [showEmoji, setShowEmoji] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder: placeholder ?? "Écrivez ici…" }),
    ],
    content: value,
    onUpdate({ editor }) {
      const html = editor.getHTML()
      onChange(html === "<p></p>" ? "" : html)
    },
  })

  const insertEmoji = useCallback((emoji: { native: string }) => {
    editor?.chain().focus().insertContent(emoji.native).run()
    setShowEmoji(false)
  }, [editor])

  if (!editor) return null

  return (
    <div className="relative">
      {/* Bubble menu — apparaît sur sélection de texte */}
      <BubbleMenu
        editor={editor}
        className="flex items-center gap-0.5 rounded-lg bg-zinc-900 dark:bg-zinc-800 border border-zinc-700 shadow-lg px-1 py-0.5"
      >
        <BubbleButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Gras (Ctrl+B)">
          <Bold className="h-3.5 w-3.5" />
        </BubbleButton>
        <BubbleButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italique (Ctrl+I)">
          <Italic className="h-3.5 w-3.5" />
        </BubbleButton>
        <BubbleButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Souligné (Ctrl+U)">
          <UnderlineIcon className="h-3.5 w-3.5" />
        </BubbleButton>
        <BubbleButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Barré">
          <Strikethrough className="h-3.5 w-3.5" />
        </BubbleButton>
        <div className="w-px h-4 bg-zinc-600 mx-0.5" />
        <BubbleButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Code inline">
          <Code className="h-3.5 w-3.5" />
        </BubbleButton>
        <BubbleButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Citation">
          <Quote className="h-3.5 w-3.5" />
        </BubbleButton>
        <div className="w-px h-4 bg-zinc-600 mx-0.5" />
        <BubbleButton
          onClick={() => {
            const url = window.prompt("URL du lien :")
            if (url) editor.chain().focus().setLink({ href: url }).run()
          }}
          active={editor.isActive("link")}
          title="Lien"
        >
          <LinkIcon className="h-3.5 w-3.5" />
        </BubbleButton>
      </BubbleMenu>

      {/* Zone d'édition avec support paste et drag & drop */}
      <div
        className={cn(
          "border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 bg-background transition-colors",
          isDragging && "border-primary bg-primary/5"
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          setIsDragging(false)
          const files = e.dataTransfer?.files
          if (!files?.length) return
          for (const file of Array.from(files)) {
            if (file.type.startsWith("image/")) {
              e.preventDefault()
              insertImageFile(editor, file)
              return
            }
          }
        }}
        onPaste={(e) => {
          const items = e.clipboardData?.items
          if (!items) return
          for (const item of Array.from(items)) {
            if (item.type.startsWith("image/")) {
              e.preventDefault()
              const file = item.getAsFile()
              if (file) insertImageFile(editor, file)
              return
            }
          }
        }}
      >
        <EditorContent
          editor={editor}
          className="prose prose-sm dark:prose-invert max-w-none px-4 pt-3 pb-2 min-h-[120px] [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[100px] [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_img]:rounded [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:my-2"
        />

        {/* Toolbar bas */}
        <div className="flex items-center gap-0.5 border-t px-2 py-1.5 bg-muted/20">
          {/* Emoji */}
          <div className="relative">
            <ToolbarButton onClick={() => setShowEmoji((v) => !v)} active={showEmoji} title="Emoji">
              <Smile className="h-5 w-5" />
            </ToolbarButton>
            {showEmoji && (
              <div className="absolute bottom-10 left-0 z-50">
                <Picker
                  data={data}
                  onEmojiSelect={insertEmoji}
                  theme={resolvedTheme === "dark" ? "dark" : "light"}
                  locale="fr"
                  previewPosition="none"
                />
              </div>
            )}
          </div>

          {/* Insérer image dans le texte */}
          <ToolbarButton
            onClick={() => fileInputRef.current?.click()}
            active={false}
            title="Insérer une image dans le texte"
          >
            <ImageIcon className="h-5 w-5" />
          </ToolbarButton>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) insertImageFile(editor, file)
              e.target.value = ""
            }}
          />

          <span className="ml-auto text-xs text-muted-foreground hidden sm:block">
            Glisse une image · Colle avec Ctrl+V · Sélectionne pour mettre en forme
          </span>
        </div>
      </div>

      {showEmoji && (
        <div className="fixed inset-0 z-40" onClick={() => setShowEmoji(false)} />
      )}
    </div>
  )
}
