import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Loader2,
  MessageCircle,
  Newspaper,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase"; // adjust this import to match your existing Supabase client path

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      {
        title: "Blog | Corepoint Tech Academy",
      },
      {
        name: "description",
        content:
          "Guides, tutorials, career advice, and trending tech topics from Corepoint Tech Academy.",
      },
      {
        property: "og:title",
        content: "Blog | Corepoint Tech Academy",
      },
      {
        property: "og:description",
        content:
          "Practical, no-fluff resources and trending topics on data, AI, and building a tech career in Nigeria.",
      },
    ],
  }),
  component: BlogPage,
});

type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  created_at: string;
  read_time: string | null;
  featured: boolean;
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadPosts() {
      setLoading(true);

      const { data, error: fetchError } = await supabase
        .from("blog_posts")
        .select("slug, title, excerpt, author, created_at, read_time, featured")
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (!isMounted) return;

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setPosts(data ?? []);
      }

      setLoading(false);
    }

    loadPosts();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) =>
      post.title.toLowerCase().includes(query.toLowerCase()),
    );
  }, [posts, query]);

  const showFeatured = query === "";
  const featuredPost = posts.find((post) => post.featured);
  const remainingPosts = showFeatured
    ? filteredPosts.filter((post) => post.slug !== featuredPost?.slug)
    : filteredPosts;

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-hero-gradient text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:py-20">
          <div className="mx-auto flex max-w-fit items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-2 text-sm">
            <Newspaper className="size-4" />
            Corepoint Tech Blog
          </div>

          <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Guides, Tutorials &{" "}
            <span className="text-primary-foreground/80">
              Trending Topics
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-primary-foreground/80 sm:text-lg">
            Practical, no-fluff resources on data, AI, careers, and whatever
            else is worth writing about in tech right now.
          </p>
        </div>
      </section>

      {/* Search */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search articles..."
              className="w-full rounded-full border border-border bg-card py-2.5 pl-9 pr-4 text-sm outline-none ring-primary/20 focus:ring-2"
            />
          </div>
        </div>
      </section>

      {/* Loading / Error states */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          Loading articles...
        </div>
      )}

      {!loading && error && (
        <div className="mx-auto max-w-6xl px-4 py-12 text-center text-destructive">
          Couldn't load articles right now: {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Featured Post */}
          {showFeatured && featuredPost && (
            <section className="mx-auto max-w-6xl px-4 py-12">
              <Link
                to="/blog/$slug"
                params={{ slug: featuredPost.slug }}
                className="group grid gap-6 overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-lg sm:p-8 lg:grid-cols-[1fr_1.2fr] lg:items-center"
              >
                <div className="flex aspect-video items-center justify-center rounded-xl bg-primary/10">
                  <BookOpen className="size-16 text-primary/60" />
                </div>

                <div>
                  <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    {featuredPost.title}
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {featuredPost.excerpt}
                  </p>

                  <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span>{featuredPost.author}</span>
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="size-3.5" />
                      {formatDate(featuredPost.created_at)}
                    </span>
                    {featuredPost.read_time && <span>{featuredPost.read_time}</span>}
                  </div>

                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                    Read article
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </section>
          )}

          {/* Post Grid */}
          <section className="mx-auto max-w-6xl px-4 pb-16 sm:pb-20">
            {remainingPosts.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">
                {posts.length === 0
                  ? "No articles published yet. Check back soon."
                  : "No articles match your search yet. Try a different keyword."}
              </p>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {remainingPosts.map((post) => (
                  <Link
                    key={post.slug}
                    to="/blog/$slug"
                    params={{ slug: post.slug }}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="flex aspect-video items-center justify-center bg-primary/10">
                      <BookOpen className="size-10 text-primary/60" />
                    </div>

                    <div className="flex flex-1 flex-col p-6">
                      <h3 className="text-lg font-bold leading-6">
                        {post.title}
                      </h3>

                      <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">
                        {post.excerpt}
                      </p>

                      <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <CalendarDays className="size-3.5" />
                          {formatDate(post.created_at)}
                        </span>
                        {post.read_time && <span>{post.read_time}</span>}
                      </div>

                      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                        Read article
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </>
      )}

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
    </div>
  );
}
