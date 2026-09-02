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
    const title = `${course.title} in Lagos | Corepoint Tech Academy`;
    const description = `${course.summary} Learn ${course.title} in Lagos or live online with Corepoint Tech Academy.`;

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Course",
      name: course.title,
      description: course.summary,
      provider: {
        "@type": "Organization",
        name: "Corepoint Tech Academy",
        sameAs: "https://corepointtech.com.ng",
      },
    };

    const faqStructuredData =
      course.faqs && course.faqs.length > 0
        ? {
            "@context": "https://schema.org",
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

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(structuredData),
        },
        ...(faqStructuredData
          ? [
              {
                type: "application/ld+json",
                children: JSON.stringify(faqStructuredData),
              },
            ]
          : []),
      ],
    };
  },
  component: CourseDetail,
});

function CourseDetail() {
  const { course } = Route.useLoaderData();
  const related = courses
    .filter((c) => c.category === course.category && c.slug !== course.slug)
    .slice(0, 3);

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
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{course.title}</h1>
            <p className="mt-4 max-w-xl text-primary-foreground/85">{course.summary}</p>
            <Button asChild variant="cta" size="xl" className="mt-7">
              <Link to="/register" search={{ course: course.slug }}>
                Register for This Course
              </Link>
            </Button>
          </div>
          <img
            src={course.image}
            alt={course.title}
            width={1024}
            height={640}
            className="w-full rounded-2xl object-cover shadow-lift"
          />
        </div>
      </section>

      {course.seoIntro && (
        <section className="mx-auto max-w-6xl px-4 pt-10">
          <p className="max-w-3xl text-muted-foreground">{course.seoIntro}</p>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4">
        <div className="-mt-8 grid gap-px overflow-hidden rounded-2xl border border-border bg-border shadow-card sm:grid-cols-2 lg:grid-cols-4">
          {facts.map((f) => (
            <div key={f.label} className="bg-card p-5">
              <f.icon className="size-5 text-primary" />
              <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">{f.label}</p>
              <p className="text-sm font-semibold">{f.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-12 px-4 py-14 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-12">
          <div>
            <h2 className="text-2xl font-bold">Course overview</h2>
            <p className="mt-4 text-muted-foreground">{course.overview}</p>
            <p className="mt-4 text-muted-foreground">
              <span className="font-semibold text-foreground">Who it&apos;s for: </span>
              {course.audience}
            </p>
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
            <h2 className="text-2xl font-bold">Curriculum</h2>
            <Accordion type="single" collapsible className="mt-4 rounded-2xl border border-border bg-card px-5">
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
              <h2 className="text-2xl font-bold">Tools you'll use</h2>
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
            </div>
          )}

          {course.projects && course.projects.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold">Projects you'll build</h2>
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
              <Accordion type="single" collapsible className="mt-4 rounded-2xl border border-border bg-card px-5">
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
            <h3 className="text-lg font-semibold">Ready to join the next cohort?</h3>
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