import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CourseCard } from "@/components/site/CourseCard";
import { categories, courses, type CategoryId } from "@/data/courses";
import { cn } from "@/lib/utils";

type Search = { category?: CategoryId | "all" };

export const Route = createFileRoute("/courses/")({
  validateSearch: (search: Record<string, unknown>): Search => {
    const c = search["category"];
    const valid = categories.some((cat) => cat.id === c);
    return valid ? { category: c as CategoryId } : {};
  },
  head: () => ({
    meta: [
      { title: "Course Catalog | Northbridge Tech Academy" },
      {
        name: "description",
        content:
          "Browse instructor-led courses in AI, data science, software development, cybersecurity, cloud, databases and automation.",
      },
      { property: "og:title", content: "Course Catalog | Northbridge Tech Academy" },
      {
        property: "og:description",
        content: "Hands-on technology training delivered live online and in person in Lagos.",
      },
    ],
  }),
  component: CoursesPage,
});

function CoursesPage() {
  const { category } = Route.useSearch();
  const navigate = useNavigate({ from: "/courses" });
  const [query, setQuery] = useState("");
  const active = category ?? "all";

  const filtered = useMemo(
    () =>
      courses.filter(
        (c) =>
          (active === "all" || c.category === active) &&
          c.title.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [active, query],
  );

  const tabs = [{ id: "all", label: "All" }, ...categories.map((c) => ({ id: c.id, label: c.shortName }))];

  return (
    <div>
      <section className="bg-hero-gradient text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h1 className="text-4xl font-bold sm:text-5xl">Course Catalog</h1>
          <p className="mt-3 max-w-2xl text-primary-foreground/80">
            {courses.length} instructor-led programmes across seven disciplines. Filter by category
            or search by title to find the right fit.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  navigate({
                    search: tab.id === "all" ? {} : { category: tab.id as CategoryId },
                  })
                }
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                  active === tab.id
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              maxLength={80}
              placeholder="Search courses"
              aria-label="Search courses by title"
              className="pl-9"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="py-20 text-center text-muted-foreground">
            No courses match that search. Try another keyword or category.
          </p>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((course) => (
              <CourseCard key={course.slug} course={course} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}