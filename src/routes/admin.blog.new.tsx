import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { LogOut, Loader2, Save, Sparkles } from "lucide-react";
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

function NewBlogPostPage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [excerpt, setExcerpt] = useState("");
  const [author, setAuthor] = useState("Corepoint Tech Team");
  const [content, setContent] = useState("");
  const [featured, setFeatured] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
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
            Article content
          </label>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={16}
            placeholder="Paste the full article here. Markdown is supported (## headings, **bold**, lists, links, etc.)."
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
