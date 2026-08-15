import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, HeartHandshake, Target, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-training.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us | Corepoint Tech Academy" },
      {
        name: "description",
        content:
          "Corepoint Tech Academy trains professionals in AI, data, development, security and cloud through small, project-based classes led by practitioners.",
      },
      { property: "og:title", content: "About Corepoint Tech Academy" },
      {
        property: "og:description",
        content: "Small classes, real projects, instructors who still work in the field.",
      },
    ],
  }),
  component: AboutPage,
});

const values = [
  {
    icon: Users,
    title: "Small cohorts",
    body: "We cap classes so every learner gets feedback on their own work, every week.",
  },
  {
    icon: Target,
    title: "Project-based",
    body: "You learn on real, messy datasets and real codebases — not toy examples.",
  },
  {
    icon: Award,
    title: "Practitioner instructors",
    body: "Every trainer works in the field they teach, so the advice is current.",
  },
  {
    icon: HeartHandshake,
    title: "Support after class",
    body: "Portfolio review, CV feedback and an alumni community that keeps hiring each other.",
  },
];

function AboutPage() {
  return (
    <div>
      <section className="bg-hero-gradient text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h1 className="text-4xl font-bold sm:text-5xl">About Northbridge Tech</h1>
          <p className="mt-4 max-w-2xl text-primary-foreground/80">
            We are a technology training academy built around one belief: people learn tools by
            using them on work that matters.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-2 lg:items-center">
        <img
          src={heroImg}
          alt="Students working together in a Northbridge Tech classroom"
          loading="lazy"
          width={1600}
          height={1008}
          className="rounded-2xl object-cover shadow-lift"
        />
        <div>
          <h2 className="text-3xl font-bold">Our story</h2>
          <p className="mt-4 text-muted-foreground">
            Northbridge began as a weekend study group for analysts who wanted to move beyond
            spreadsheets. Word spread, the group outgrew the room, and it became a full academy
            with structured programmes across seven disciplines.
          </p>
          <p className="mt-4 text-muted-foreground">
            We kept the things that made those early sessions work: small groups, live instruction,
            honest feedback, and a project you can actually show an employer at the end.
          </p>
          <h2 className="mt-10 text-3xl font-bold">Our mission</h2>
          <p className="mt-4 text-muted-foreground">
            To make world-class, practical technology education accessible to anyone with the
            discipline to show up — online from anywhere, or in person in Lagos.
          </p>
        </div>
      </section>

      <section className="bg-secondary/50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold">Why train with us</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.title} className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <v.icon className="size-6 text-primary" />
                <h3 className="mt-4 text-lg font-semibold">{v.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h2 className="text-3xl font-bold">Find the programme that fits you</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Browse the catalog, or tell us your goal and we&apos;ll recommend a track.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button asChild variant="cta" size="lg">
            <Link to="/courses">Explore Courses</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/contact">Talk to us</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}