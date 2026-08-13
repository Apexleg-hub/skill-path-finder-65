import { createFileRoute } from "@tanstack/react-router";
import { RegistrationForm } from "@/components/site/RegistrationForm";
import { getCourse } from "@/data/courses";

type RegisterSearch = { course?: string };

export const Route = createFileRoute("/register")({
  validateSearch: (search: Record<string, unknown>): RegisterSearch =>
    typeof search["course"] === "string" ? { course: search["course"] } : {},
  head: () => ({
    meta: [
      { title: "Register Your Interest | Northbridge Tech Academy" },
      {
        name: "description",
        content:
          "Tell us which course you want and how you'd like to learn. Our admissions team calls you back within one working day.",
      },
      { property: "og:title", content: "Register Your Interest | Northbridge Tech Academy" },
      {
        property: "og:description",
        content: "No payment online — register your interest and we'll get in touch.",
      },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const { course } = Route.useSearch();
  const selected = course ? getCourse(course) : undefined;

  return (
    <div>
      <section className="bg-hero-gradient text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h1 className="text-4xl font-bold sm:text-5xl">Register your interest</h1>
          <p className="mt-3 max-w-2xl text-primary-foreground/80">
            {selected
              ? `You're registering for ${selected.title}. Fill in your details and we'll confirm the next cohort with you.`
              : "Fill in your details and our admissions team will contact you within one working day with cohort dates and fees."}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12">
        <RegistrationForm defaultCourse={selected?.title} />
      </section>
    </div>
  );
}