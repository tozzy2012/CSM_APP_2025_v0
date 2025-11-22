/**
 * Rich Text Editor Component
 * Editor completo com formatação, imagens e upload
 */
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Highlighter,
} from "lucide-react";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";

interface RichTextEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
}

export default function RichTextEditor({
  content = "",
  onChange,
  placeholder = "Comece a escrever...",
  editable = true,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML());
      }
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none focus:outline-none min-h-[300px] p-4",
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const addImage = useCallback(() => {
    const url = window.prompt("URL da imagem:");

    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const addImageFromFile = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && editor) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          editor.chain().focus().setImage({ src: base64 }).run();
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }, [editor]);

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL:", previousUrl);

    if (url === null) {
      return;
    }

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  if (!editable) {
    return (
      <div className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none">
        <EditorContent editor={editor} />
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-accent p-2 border-b border-border flex flex-wrap gap-1">
        {/* Text Formatting */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "bg-accent-foreground/10" : ""}
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "bg-accent-foreground/10" : ""}
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={
            editor.isActive("underline") ? "bg-accent-foreground/10" : ""
          }
        >
          <UnderlineIcon className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive("strike") ? "bg-accent-foreground/10" : ""}
        >
          <Strikethrough className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={editor.isActive("code") ? "bg-accent-foreground/10" : ""}
        >
          <Code className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={
            editor.isActive("highlight") ? "bg-accent-foreground/10" : ""
          }
        >
          <Highlighter className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-8" />

        {/* Headings */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={
            editor.isActive("heading", { level: 1 })
              ? "bg-accent-foreground/10"
              : ""
          }
        >
          <Heading1 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={
            editor.isActive("heading", { level: 2 })
              ? "bg-accent-foreground/10"
              : ""
          }
        >
          <Heading2 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={
            editor.isActive("heading", { level: 3 })
              ? "bg-accent-foreground/10"
              : ""
          }
        >
          <Heading3 className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-8" />

        {/* Lists */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={
            editor.isActive("bulletList") ? "bg-accent-foreground/10" : ""
          }
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={
            editor.isActive("orderedList") ? "bg-accent-foreground/10" : ""
          }
        >
          <ListOrdered className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={
            editor.isActive("blockquote") ? "bg-accent-foreground/10" : ""
          }
        >
          <Quote className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-8" />

        {/* Alignment */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={
            editor.isActive({ textAlign: "left" }) ? "bg-accent-foreground/10" : ""
          }
        >
          <AlignLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={
            editor.isActive({ textAlign: "center" })
              ? "bg-accent-foreground/10"
              : ""
          }
        >
          <AlignCenter className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={
            editor.isActive({ textAlign: "right" })
              ? "bg-accent-foreground/10"
              : ""
          }
        >
          <AlignRight className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-8" />

        {/* Media */}
        <Button variant="ghost" size="sm" onClick={setLink}>
          <LinkIcon className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={addImageFromFile}>
          <ImageIcon className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-8" />

        {/* Undo/Redo */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="w-4 h-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <div className="bg-background">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
