import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Underline } from "@tiptap/extension-underline";
import { TextAlign } from "@tiptap/extension-text-align";
import { Image } from "@tiptap/extension-image";
import { Link } from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Minus,
  Redo2,
  Table as TableIcon,
  Underline as UnderlineIcon,
  Undo2,
  Unlink,
  Upload,
} from "lucide-react";

const toolbarButton =
  "inline-flex size-8 items-center justify-center rounded-md text-sm hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40";

type Props = {
  value: string;
  onChange: (html: string) => void;
  onUploadImage?: (file: File) => Promise<string>;
  onPreview?: (html: string) => void;
};

export function RichTextEditor({ value, onChange, onUploadImage, onPreview }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image.configure({ allowBase64: false, inline: false }),
      Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "rich-text-editor min-h-80 max-h-[520px] overflow-y-auto px-5 py-4 focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) editor.commands.setContent(value || "", { emitUpdate: false });
  }, [value, editor]);

  async function insertImage(file: File | undefined) {
    if (!file || !editor || !onUploadImage) return;
    setUploading(true);
    try {
      const url = await onUploadImage(file);
      editor.chain().focus().setImage({ src: url }).run();
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function setHyperlink() {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter link URL", previous || "https://");
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }

  function insertTable() {
    if (!editor) return;
    const rows = Number(window.prompt("Number of rows", "3") || 0);
    const cols = Number(window.prompt("Number of columns", "3") || 0);
    if (!Number.isInteger(rows) || !Number.isInteger(cols) || rows < 1 || cols < 1) return;
    if (rows > 20 || cols > 10) {
      window.alert("Tables can have at most 20 rows and 10 columns.");
      return;
    }
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
  }

  if (!editor) return <div className="min-h-80 rounded-md border border-input bg-background" />;

  return (
    <div className="overflow-hidden rounded-md border border-input bg-background">
      <div className="flex flex-wrap items-center gap-1 border-b border-input bg-muted/30 p-2">
        <select
          aria-label="Heading level"
          className="mr-1 h-8 rounded-md border border-input bg-background px-2 text-sm"
          value={editor.isActive("heading", { level: 2 }) ? "2" : editor.isActive("heading", { level: 3 }) ? "3" : "p"}
          onChange={(e) => {
            const value = e.target.value;
            if (value === "p") editor.chain().focus().setParagraph().run();
            else editor.chain().focus().toggleHeading({ level: Number(value) as 2 | 3 }).run();
          }}
        >
          <option value="p">Paragraph</option>
          <option value="2">Heading 2</option>
          <option value="3">Heading 3</option>
        </select>

        <button type="button" className={toolbarButton} title="Bold" aria-label="Bold" onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="size-4" /></button>
        <button type="button" className={toolbarButton} title="Italic" aria-label="Italic" onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="size-4" /></button>
        <button type="button" className={toolbarButton} title="Underline" aria-label="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="size-4" /></button>
        <button type="button" className={toolbarButton} title="Bulleted list" aria-label="Bulleted list" onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="size-4" /></button>
        <button type="button" className={toolbarButton} title="Numbered list" aria-label="Numbered list" onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="size-4" /></button>
        <button type="button" className={toolbarButton} title="Align left" aria-label="Align left" onClick={() => editor.chain().focus().setTextAlign("left").run()}><AlignLeft className="size-4" /></button>
        <button type="button" className={toolbarButton} title="Align center" aria-label="Align center" onClick={() => editor.chain().focus().setTextAlign("center").run()}><AlignCenter className="size-4" /></button>
        <button type="button" className={toolbarButton} title="Align right" aria-label="Align right" onClick={() => editor.chain().focus().setTextAlign("right").run()}><AlignRight className="size-4" /></button>
        <button type="button" className={toolbarButton} title="Add link" aria-label="Add link" onClick={setHyperlink}><Link2 className="size-4" /></button>
        <button type="button" className={toolbarButton} title="Remove link" aria-label="Remove link" onClick={() => editor.chain().focus().unsetLink().run()}><Unlink className="size-4" /></button>
        <button type="button" className={toolbarButton} title="Insert table" aria-label="Insert table" onClick={insertTable}><TableIcon className="size-4" /></button>
        <button type="button" className={toolbarButton} title="Horizontal divider" aria-label="Horizontal divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus className="size-4" /></button>
        <button type="button" className={toolbarButton} title="Undo" aria-label="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}><Undo2 className="size-4" /></button>
        <button type="button" className={toolbarButton} title="Redo" aria-label="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}><Redo2 className="size-4" /></button>

        {onUploadImage && (
          <>
            <button type="button" className={`${toolbarButton} w-auto gap-1 px-2`} title="Upload image" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}<span className="text-xs">Image</span>
            </button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => void insertImage(e.target.files?.[0])} />
          </>
        )}

        {editor.isActive("table") && (
          <>
            <button type="button" className="h-8 rounded-md px-2 text-xs hover:bg-secondary" onClick={() => editor.chain().focus().addColumnAfter().run()}>+ Column</button>
            <button type="button" className="h-8 rounded-md px-2 text-xs hover:bg-secondary" onClick={() => editor.chain().focus().deleteColumn().run()}>− Column</button>
            <button type="button" className="h-8 rounded-md px-2 text-xs hover:bg-secondary" onClick={() => editor.chain().focus().addRowAfter().run()}>+ Row</button>
            <button type="button" className="h-8 rounded-md px-2 text-xs hover:bg-secondary" onClick={() => editor.chain().focus().deleteRow().run()}>− Row</button>
            <button type="button" className="h-8 rounded-md px-2 text-xs hover:bg-secondary" onClick={() => editor.chain().focus().deleteTable().run()}>Delete table</button>
          </>
        )}

        {onPreview && <button type="button" className="ml-auto h-8 rounded-md border border-input px-3 text-xs font-semibold hover:bg-secondary" onClick={() => onPreview(editor.getHTML())}>Preview</button>}
      </div>
      <EditorContent editor={editor} />
      <div className="border-t border-input px-3 py-2 text-xs text-muted-foreground">JPG, PNG or WebP images are uploaded to Corepoint storage.</div>
    </div>
  );
}
