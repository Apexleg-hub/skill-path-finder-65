import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Loader2,
  MessageCircle,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase"; // adjust this import to match your existing Supabase client path

export const Route = createFileRoute("/blog/$slug")({
  component: BlogPostPage,
});

type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  content: string;
  created_at: string;
  read_time: string | null;
  image_url: string | null;
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Treats plain single-line-broken text as separate paragraphs (with real
// spacing) while leaving Markdown tables, lists, and headings untouched, so
// pasted articles look properly spaced without needing manual blank lines.
function normalizeParagraphs(text: string) {
  const lines = text.split("\n");

  function isStructuralLine(line: string) {
    const trimmed = line.trim();
    if (trimmed === "") return true;
    if (trimmed.startsWith("|")) return true; // table row
    if (/^(-|\*|\+)\s/.test(trimmed)) return true; // bullet list
    if (/^\d+\.\s/.test(trimmed)) return true; // numbered list
    if (trimmed.startsWith("#")) return true; // heading
    if (trimmed.startsWith(">")) return true; // blockquote
    return false;
  }

  const output: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const current = lines[i];
    output.push(current);

    const next = lines[i + 1];
    if (next === undefined) continue;

    const currentTrim = current.trim();
    const nextTrim = next.trim();

    if (currentTrim === "" || nextTrim === "") continue;

    const currentStructural = isStructuralLine(current);
    const nextStructural = isStructuralLine(next);

    // Keep consecutive table rows / list items / blockquote lines adjacent,
    // since Markdown needs them unbroken to parse correctly.
    if (currentStructural && nextStructural) continue;

    output.push("");
  }

  return output.join("\n");
}

function BlogPostPage() {
  const { slug } = Route.useParams();

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadPost() {
      setLoading(true);
      setNotFound(false);

      const { data, error } = await supabase
        .from("blog_posts")
        .select("slug, title, excerpt, author, content, created_at, read_time, image_url")
        .eq("slug", slug)
        .eq("published", true)
        .single();

      if (!isMounted) return;

      if (error || !data) {
        setNotFound(true);
      } else {
        setPost(data);
      }

      setLoading(false);
    }

    loadPost();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Loading article...
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <BookOpen className="mx-auto size-12 text-muted-foreground/40" />
        <h1 className="mt-4 text-2xl font-bold">Article not found</h1>
        <p className="mt-2 text-muted-foreground">
          This article may have been moved, unpublished, or the link is
          incorrect.
        </p>
        <Button asChild size="lg" className="mt-6">
          <Link to="/blog">Back to Blog</Link>
        </Button>
      </div>
    );
  }

  return (
    <article>
      {/* Header */}
      <section className="bg-hero-gradient text-primary-foreground">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to Blog
          </Link>

          <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            {post.title}
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-primary-foreground/80">
            <span className="flex items-center gap-1.5">
              <User className="size-4" />
              {post.author}
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-4" />
              {formatDate(post.created_at)}
            </span>
            {post.read_time && <span>{post.read_time}</span>}
          </div>
        </div>
      </section>

      {/* Featured image */}
      {post.image_url && (
        <div className="mx-auto max-w-3xl px-4 pt-8">
          <img
            src={post.image_url}
            alt={post.title}
            className="aspect-video w-full rounded-2xl object-cover"
          />
        </div>
      )}

      {/* Article body */}
      <section className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <div
          className="[&_h1]:mb-5 [&_h1]:mt-10 [&_h1]:text-3xl [&_h1]:font-bold
                     [&_h2]:mb-4 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-bold
                     [&_h3]:mb-3 [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-bold
                     [&_p]:mb-5 [&_p]:leading-7 [&_p]:text-foreground
                     [&_ul]:mb-5 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6
                     [&_ol]:mb-5 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6
                     [&_li]:leading-7
                     [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2
                     [&_strong]:font-semibold
                     [&_blockquote]:mb-5 [&_blockquote]:border-l-4 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground
                     [&_img]:mb-5 [&_img]:rounded-xl
                     [&_table]:mb-5 [&_table]:w-full [&_table]:border-collapse
                     [&_th]:border [&_th]:border-border [&_th]:bg-muted/40 [&_th]:p-3 [&_th]:text-left
                     [&_td]:border [&_td]:border-border [&_td]:p-3"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {normalizeParagraphs(post.content)}
          </ReactMarkdown>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-hero-gradient text-primary-foreground">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:py-20">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary-foreground/10">
            <MessageCircle className="size-6" />
          </div>

          <h2 className="mt-5 text-3xl font-bold sm:text-4xl">
            Ready to build real skills?
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/80">
            Turn what you're reading into practical, job-ready experience with
            hands-on training at Corepoint Tech Academy.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" variant="cta">
              <Link to="/apply">Apply Now</Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </article>
  );
}
