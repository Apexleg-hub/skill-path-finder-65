import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  ImageIcon,
  Link as LinkIcon,
  LogOut,
  Loader2,
  Minus,
  Plus,
  Save,
  Sparkles,
  Table as TableIcon,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase"; // adjust this import to match your existing Supabase client path

export const Route = createFileRoute("/admin/blog/new")({
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getSession();

    if (!data.session) {
      throw redirect({
        to: "/admin/login",
        search: { redirect: location.pathname },
      });
    }
  },
  component: NewBlogPostPage,
});

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function estimateReadTime(content: string) {
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}

function cellToMarkdown(value: string) {
  // Escape pipe characters so they don't break the table structure
  return value.replace(/\|/g, "\\|").trim() || " ";
}

function buildMarkdownTable(rows: string[][]) {
  if (rows.length === 0) return "";

  const header = rows[0];
  const body = rows.slice(1);

  const headerLine = `| ${header.map(cellToMarkdown).join(" | ")} |`;
  const separatorLine = `| ${header.map(() => "---").join(" | ")} |`;
  const bodyLines = body.map(
    (row) => `| ${row.map(cellToMarkdown).join(" | ")} |`,
  );

  return [headerLine, separatorLine, ...bodyLines].join("\n");
}

function NewBlogPostPage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [excerpt, setExcerpt] = useState("");
  const [author, setAuthor] = useState("Corepoint Tech Team");
  const [content, setContent] = useState("");
  const [featured, setFeatured] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contentRef = useRef<HTMLTextAreaElement>(null);

  const [showTableBuilder, setShowTableBuilder] = useState(false);
  const [tableRows, setTableRows] = useState<string[][]>([
    ["Column 1", "Column 2"],
    ["", ""],
  ]);

  const [showLinkBuilder, setShowLinkBuilder] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  function insertAtCursor(textToInsert: string) {
    const textarea = contentRef.current;

    if (!textarea) {
      setContent((prev) => `${prev}\n\n${textToInsert}\n\n`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = content.slice(0, start);
    const after = content.slice(end);

    // Add surrounding blank lines so the inserted block doesn't run into
    // neighbouring text
    const needsLeadingBreak = before.length > 0 && !before.endsWith("\n\n");
    const needsTrailingBreak = after.length > 0 && !after.startsWith("\n\n");

    const insertion = `${needsLeadingBreak ? "\n\n" : ""}${textToInsert}${
      needsTrailingBreak ? "\n\n" : ""
    }`;

    const newContent = `${before}${insertion}${after}`;
    setContent(newContent);

    // Move cursor to just after the inserted block on next render
    requestAnimationFrame(() => {
      const cursorPos = before.length + insertion.length;
      textarea.focus();
      textarea.setSelectionRange(cursorPos, cursorPos);
    });
  }

  function updateTableCell(rowIndex: number, colIndex: number, value: string) {
    setTableRows((prev) =>
      prev.map((row, r) =>
        r === rowIndex
          ? row.map((cell, c) => (c === colIndex ? value : cell))
          : row,
      ),
    );
  }

  function addTableRow() {
    setTableRows((prev) => [...prev, prev[0].map(() => "")]);
  }

  function removeTableRow(rowIndex: number) {
    setTableRows((prev) =>
      prev.length > 2 ? prev.filter((_, r) => r !== rowIndex) : prev,
    );
  }

  function addTableColumn() {
    setTableRows((prev) =>
      prev.map((row, r) =>
        r === 0 ? [...row, `Column ${row.length + 1}`] : [...row, ""],
      ),
    );
  }

  function removeTableColumn(colIndex: number) {
    setTableRows((prev) =>
      prev[0].length > 2
        ? prev.map((row) => row.filter((_, c) => c !== colIndex))
        : prev,
    );
  }

  function handleInsertTable() {
    insertAtCursor(buildMarkdownTable(tableRows));
    setShowTableBuilder(false);
    setTableRows([
      ["Column 1", "Column 2"],
      ["", ""],
    ]);
  }

  function handleInsertLink() {
    if (!linkText.trim() || !linkUrl.trim()) return;
    insertAtCursor(`[${linkText.trim()}](${linkUrl.trim()})`);
    setShowLinkBuilder(false);
    setLinkText("");
    setLinkUrl("");
  }

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  }

  async function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setImageUploading(true);

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("blog-images")
      .upload(fileName, file);

    if (uploadError) {
      setError(`Image upload failed: ${uploadError.message}`);
      setImageUploading(false);
      return;
    }

    const { data } = supabase.storage.from("blog-images").getPublicUrl(fileName);
    setImageUrl(data.publicUrl);
    setImageUploading(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/admin/login" });
  }

  async function handleSave(publish: boolean) {
    setError(null);

    if (!title.trim() || !slug.trim() || !content.trim() || !excerpt.trim()) {
      setError("Title, slug, excerpt, and article content are all required.");
      return;
    }

    setSaving(true);

    const { error: insertError } = await supabase.from("blog_posts").insert({
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt.trim(),
      author: author.trim() || "Corepoint Tech Team",
      content,
      image_url: imageUrl,
      read_time: estimateReadTime(content),
      featured,
      published: publish,
    });

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    navigate({ to: "/blog" });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="flex max-w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm text-primary">
            <Sparkles className="size-4" />
            New Article
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight">
            Paste in a new blog post
          </h1>

          <p className="mt-2 text-muted-foreground">
            Fill in the fields below, paste the full article text into the
            content box, and publish. Write about anything — course topics,
            trending news, career advice — no category required.
          </p>
        </div>

        <Button type="button" variant="outline" size="sm" onClick={handleSignOut}>
          <LogOut className="size-4" />
          Sign Out
        </Button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
        <div>
          <label className="mb-1.5 block text-sm font-semibold">Title</label>
          <input
            type="text"
            value={title}
            onChange={(event) => handleTitleChange(event.target.value)}
            placeholder="e.g. Best Data Science Training in Lagos: Complete 2026 Guide"
            className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm outline-none ring-primary/20 focus:ring-2"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold">
            URL slug
          </label>
          <input
            type="text"
            value={slug}
            onChange={(event) => {
              setSlug(slugify(event.target.value));
              setSlugTouched(true);
            }}
            placeholder="best-data-science-training-lagos-2026-guide"
            className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 font-mono text-sm outline-none ring-primary/20 focus:ring-2"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Auto-filled from the title. The post will live at /blog/{slug || "your-slug"}
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold">
            Excerpt / summary
          </label>
          <textarea
            value={excerpt}
            onChange={(event) => setExcerpt(event.target.value)}
            rows={2}
            placeholder="One or two sentences shown on the blog listing card."
            className="w-full resize-none rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm outline-none ring-primary/20 focus:ring-2"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold">
            Author
          </label>
          <input
            type="text"
            value={author}
            onChange={(event) => setAuthor(event.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm outline-none ring-primary/20 focus:ring-2"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold">
            Featured image
          </label>

          {imageUrl ? (
            <div className="relative overflow-hidden rounded-lg border border-border">
              <img
                src={imageUrl}
                alt="Featured"
                className="aspect-video w-full object-cover"
              />
              <button
                type="button"
                onClick={() => setImageUrl(null)}
                className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm hover:bg-background"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <label className="flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background text-sm text-muted-foreground hover:bg-muted/40">
              {imageUploading ? (
                <>
                  <Loader2 className="size-6 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <ImageIcon className="size-6" />
                  Click to upload an image
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={imageUploading}
                className="hidden"
              />
            </label>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Shown on the blog listing card and at the top of the article.
            Optional — leave blank to use a placeholder.
          </p>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="block text-sm font-semibold">
              Article content
            </label>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowLinkBuilder(false);
                  setShowTableBuilder((prev) => !prev);
                }}
              >
                <TableIcon className="size-4" />
                Insert Table
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowTableBuilder(false);
                  setShowLinkBuilder((prev) => !prev);
                }}
              >
                <LinkIcon className="size-4" />
                Insert Link
              </Button>
            </div>
          </div>

          {/* Table builder panel */}
          {showTableBuilder && (
            <div className="mb-3 rounded-lg border border-border bg-muted/30 p-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <tbody>
                    {tableRows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, colIndex) => (
                          <td key={colIndex} className="border border-border p-1">
                            <input
                              type="text"
                              value={cell}
                              onChange={(event) =>
                                updateTableCell(rowIndex, colIndex, event.target.value)
                              }
                              placeholder={rowIndex === 0 ? "Header" : "Cell"}
                              className={`w-full min-w-[100px] rounded px-2 py-1.5 text-sm outline-none ring-primary/20 focus:ring-2 ${
                                rowIndex === 0
                                  ? "bg-primary/10 font-semibold"
                                  : "bg-background"
                              }`}
                            />
                          </td>
                        ))}
                        <td className="p-1">
                          <button
                            type="button"
                            onClick={() => removeTableRow(rowIndex)}
                            className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            title="Remove row"
                          >
                            <Minus className="size-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr>
                      {tableRows[0].map((_, colIndex) => (
                        <td key={colIndex} className="p-1 text-center">
                          <button
                            type="button"
                            onClick={() => removeTableColumn(colIndex)}
                            className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            title="Remove column"
                          >
                            <Minus className="size-4" />
                          </button>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={addTableRow}>
                  <Plus className="size-4" />
                  Add Row
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={addTableColumn}>
                  <Plus className="size-4" />
                  Add Column
                </Button>

                <div className="ml-auto flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTableBuilder(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="button" size="sm" variant="cta" onClick={handleInsertTable}>
                    Insert into article
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Link builder panel */}
          {showLinkBuilder && (
            <div className="mb-3 space-y-3 rounded-lg border border-border bg-muted/30 p-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                  Link text
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(event) => setLinkText(event.target.value)}
                  placeholder="e.g. our Data Science course"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                  Course / page URL
                </label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(event) => setLinkUrl(event.target.value)}
                  placeholder="https://corepointtech.com.ng/courses/data-science"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLinkBuilder(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="cta"
                  disabled={!linkText.trim() || !linkUrl.trim()}
                  onClick={handleInsertLink}
                >
                  Insert into article
                </Button>
              </div>
            </div>
          )}

          <textarea
            ref={contentRef}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={16}
            placeholder="Paste the full article here. Use the Insert Table / Insert Link buttons above, or type Markdown directly (## headings, **bold**, lists, etc.)."
            className="w-full resize-y rounded-lg border border-border bg-background px-3.5 py-2.5 font-mono text-sm leading-6 outline-none ring-primary/20 focus:ring-2"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Estimated read time: {content.trim() ? estimateReadTime(content) : "—"}
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={featured}
            onChange={(event) => setFeatured(event.target.checked)}
            className="size-4 rounded border-border"
          />
          Feature this post at the top of the blog
        </label>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <Button
            type="button"
            size="lg"
            variant="cta"
            disabled={saving}
            onClick={() => handleSave(true)}
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Publish
          </Button>

          <Button
            type="button"
            size="lg"
            variant="outline"
            disabled={saving}
            onClick={() => handleSave(false)}
          >
            Save as draft
          </Button>
        </div>
      </div>
    </div>
  );
}
