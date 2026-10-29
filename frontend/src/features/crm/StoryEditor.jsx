import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Heading2,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
} from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function StoryEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: [StarterKit, Link.configure({ openOnClick: false })],
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });
  useEffect(() => {
    if (editor && value !== editor.getHTML())
      editor.commands.setContent(value || "", false);
  }, [value, editor]);
  if (!editor) return null;
  const items = [
    [Bold, "bold", () => editor.chain().focus().toggleBold().run()],
    [Italic, "italic", () => editor.chain().focus().toggleItalic().run()],
    [
      Heading2,
      "heading",
      () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    ],
    [
      List,
      "bullet list",
      () => editor.chain().focus().toggleBulletList().run(),
    ],
    [
      ListOrdered,
      "numbered list",
      () => editor.chain().focus().toggleOrderedList().run(),
    ],
    [Quote, "quote", () => editor.chain().focus().toggleBlockquote().run()],
  ];
  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="flex flex-wrap gap-1 border-b p-2">
        {items.map(([Icon, label, act]) => (
          <Toggle
            key={label}
            size="sm"
            aria-label={label}
            pressed={editor.isActive(
              label === "heading"
                ? "heading"
                : label === "bullet list"
                  ? "bulletList"
                  : label === "numbered list"
                    ? "orderedList"
                    : label,
            )}
            onPressedChange={act}
          >
            <Icon className="size-4" />
          </Toggle>
        ))}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Add link"
          onClick={() => {
            const href = window.prompt("Link URL");
            if (href) editor.chain().focus().setLink({ href }).run();
            else editor.chain().focus().unsetLink().run();
          }}
        >
          <LinkIcon className="size-4" />
        </Button>
      </div>
      <EditorContent
        editor={editor}
        className="prose prose-sm dark:prose-invert min-h-56 max-w-none p-4 focus-within:outline-none [&_.tiptap]:min-h-48 [&_.tiptap]:outline-none"
      />
    </div>
  );
}
