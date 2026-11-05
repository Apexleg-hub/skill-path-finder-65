import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, CalendarClock, CheckCircle2, Laptop, Layers, ListChecks } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/site/CourseCard";
import { categoryName, courses, getCourse } from "@/data/courses";
import { toAbsoluteUrl } from "@/lib/site";
import { courseSchema, pageStructuredDataScript } from "@/lib/structured-data";

export const Route = createFileRoute("/courses/$slug")({
  loader: ({ params }) => {
    const course = getCourse(params.slug);
    if (!course) throw notFound();
    return { course };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Course not found" }, { name: "robots", content: "noindex" }],
      };
    }
    const { course } = loaderData;
    const title = course.seoTitle ?? `${course.title} in Lagos | Corepoint Tech Academy`;
    const description =
      course.seoDescription ??
      `${course.summary} Learn ${course.title} in Lagos or live online with Corepoint Tech Academy.`;
    const canonicalUrl = toAbsoluteUrl(`/courses/${course.slug}`);
    const imageUrl = toAbsoluteUrl(course.image);

    const faqStructuredData =
      course.faqSchema !== false && course.faqs && course.faqs.length > 0
        ? {
            "@type": "FAQPage",
            mainEntity: course.faqs.map((f) => ({
              "@type": "Question",
              name: f.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: f.answer,
              },
            })),
          }
        : null;
    const structuredData = pageStructuredDataScript({
      name: course.title,
      url: canonicalUrl,
      description,
      image: imageUrl,
      breadcrumbs: [
        { name: "Home", url: toAbsoluteUrl("/") },
        { name: "Courses", url: toAbsoluteUrl("/courses") },
        { name: course.title, url: canonicalUrl },
      ],
      entities: [
        courseSchema(course, canonicalUrl),
        ...(faqStructuredData ? [faqStructuredData] : []),
      ],
    });

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "robots", content: "index,follow" },
        { property: "og:type", content: "website" },
        { property: "og:url", content: canonicalUrl },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:image", content: imageUrl },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: imageUrl },
      ],
      links: [{ rel: "canonical", href: canonicalUrl }],
      scripts: [structuredData],
    };
  },
  component: CourseDetail,
});

function CourseDetail() {
  const { course } = Route.useLoaderData();
  const related = course.relatedCourseSlugs
    ? course.relatedCourseSlugs.flatMap((slug) => {
        const relatedCourse = getCourse(slug);
        return relatedCourse ? [relatedCourse] : [];
      })
    : courses.filter((c) => c.category === course.category && c.slug !== course.slug).slice(0, 3);

  const facts = [
    { icon: Layers, label: "Level", value: course.level },
    { icon: CalendarClock, label: "Duration", value: course.duration },
    {
      icon: Laptop,
      label: "Delivery",
      value: course.delivery === "Both" ? "Physical & Live Online" : course.delivery,
    },
    { icon: ListChecks, label: "Category", value: categoryName(course.category) },
  ];

  return (
    <div>
      <section className="bg-hero-gradient text-primary-foreground">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <Link
              to="/courses"
              className="inline-flex items-center gap-1.5 text-sm text-primary-foreground/70 hover:text-primary-foreground"
            >
              <ArrowLeft className="size-4" /> Back to catalog
            </Link>
            <div className="mt-4">
              <Badge variant="tag" className="inline-flex">
                {categoryName(course.category)}
              </Badge>
            </div>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
              {course.seoHeading ?? course.title}
            </h1>
            <p className="mt-4 max-w-xl text-primary-foreground/85">{course.summary}</p>
            <Button asChild variant="cta" size="xl" className="mt-7">
              <Link to="/register" search={{ course: course.slug }}>
                Register for This Course
              </Link>
            </Button>
          </div>
          <img
            src={course.image}
            alt={course.imageAlt ?? course.title}
            width={1024}
            height={640}
            className="w-full rounded-2xl object-cover shadow-lift"
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4">
        <div className="-mt-8 grid gap-px overflow-hidden rounded-2xl border border-border bg-border shadow-card sm:grid-cols-2 lg:grid-cols-4">
          {facts.map((f) => (
            <div key={f.label} className="bg-card p-5">
              <f.icon className="size-5 text-primary" />
              <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">
                {f.label}
              </p>
              <p className="text-sm font-semibold">{f.value}</p>
            </div>
          ))}
        </div>
      </section>

      {course.seoIntro && (
        <section className="mx-auto max-w-6xl px-4 pt-10">
          <p className="max-w-3xl text-muted-foreground">{course.seoIntro}</p>
        </section>
      )}

      <section className="mx-auto grid max-w-6xl gap-12 px-4 py-14 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-12">
          <div>
            <h2 className="text-2xl font-bold">About the Course</h2>
            <p className="mt-4 text-muted-foreground">{course.overview}</p>
            <h3 className="mt-6 text-lg font-semibold">Who should enrol?</h3>
            <p className="mt-2 text-muted-foreground">{course.audience}</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold">What you will learn</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {course.outcomes.map((o) => (
                <li key={o} className="flex gap-2.5 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold">Course curriculum</h2>
            <Accordion
              type="single"
              collapsible
              className="mt-4 rounded-2xl border border-border bg-card px-5"
            >
              {course.curriculum.map((mod, i) => (
                <AccordionItem key={mod.module} value={mod.module}>
                  <AccordionTrigger className="text-left">
                    <span>
                      <span className="mr-3 text-sm text-primary">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {mod.module}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2 pl-9 text-sm text-muted-foreground">
                      {mod.topics.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {course.tools && course.tools.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold">Tools and software</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {course.tools.map((tool) => (
                  <span
                    key={tool}
                    className="rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium shadow-sm"
                  >
                    {tool}
                  </span>
                ))}
              </div>
              {course.toolsNote && (
                <p className="mt-3 text-sm text-muted-foreground">{course.toolsNote}</p>
              )}
            </div>
          )}

          {course.projects && course.projects.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold">Practical projects</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Build practical experience and a portfolio of completed projects through realistic
                exercises.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {course.projects.map((project) => (
                  <li key={project} className="flex gap-2.5">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>{project}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {course.careerOpportunities && (
            <div>
              <h2 className="text-2xl font-bold">Career and business opportunities</h2>
              <p className="mt-4 text-muted-foreground">{course.careerOpportunities}</p>
            </div>
          )}

          {course.certificate && (
            <div>
              <h2 className="text-2xl font-bold">Certificate of Completion</h2>
              <p className="mt-4 text-muted-foreground">{course.certificate}</p>
            </div>
          )}

          <div>
            <h2 className="text-2xl font-bold">Prerequisites</h2>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {course.prerequisites.map((p) => (
                <li key={p}>• {p}</li>
              ))}
            </ul>
          </div>

          {course.faqs && course.faqs.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold">Frequently asked questions</h2>
              <Accordion
                type="single"
                collapsible
                className="mt-4 rounded-2xl border border-border bg-card px-5"
              >
                {course.faqs.map((faq) => (
                  <AccordionItem key={faq.question} value={faq.question}>
                    <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground">{faq.answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="text-lg font-semibold">How to enrol</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Register your interest and our admissions team will call you with dates, fees and
              payment options. No payment is taken online.
            </p>
            <Button asChild variant="cta" className="mt-5 w-full">
              <Link to="/register" search={{ course: course.slug }}>
                Register for This Course
              </Link>
            </Button>
            <Button asChild variant="outline" className="mt-3 w-full">
              <Link to="/contact">Ask a question</Link>
            </Button>
            <Link
              to="/courses"
              search={{ category: course.category }}
              className="mt-4 block text-center text-sm font-medium text-primary hover:underline"
            >
              Browse {categoryName(course.category)} courses
            </Link>
          </div>
        </aside>
      </section>

      {related.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-6">
          <h2 className="text-2xl font-bold">Related courses</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((c) => (
              <CourseCard key={c.slug} course={c} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
