import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Building2, Laptop, Users, Target, Award, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/site/CourseCard";
import { categories, featuredCourses } from "@/data/courses";
import heroImg from "@/assets/hero-training.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Corepoint Tech Academy" },
      {
        name: "description",
        content:
          "Instructor-led training in AI, data science, software development, cybersecurity, cloud, databases and automation. Live online or in person in Lagos.",
      },
      { property: "og:title", content: "Corepoint Tech Academy | Hands-On Technology Training" },
      {
        property: "og:description",
        content: "Small classes, real projects, working professionals as instructors.",
      },
    ],
  }),
  component: Index,
});

const valueProps = [
  {
    icon: Users,
    title: " One-On-One ",
    body: "One-On-One classes with personalized attention, mentorship and feedback from instructors.",
  },
  {
    icon: Target,
    title: "Real Projects",
    body: "Build projects that can become part of your professional portfolio.",
  },
  {
    icon: Award,
    title: "Industry Instructors",
    body: "Learn from practitioners who work with the technologies they teach.",
  },
  {
    icon: HeartHandshake,
    title: "Career Support",
    body: "CV reviews, portfolio guidance, interview preparation and career direction.",
  },
];

function Index() {
  return (
    <div>
      <section className="bg-hero-gradient text-primary-foreground">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:py-24">
          <div>
            <span className="inline-flex rounded-full border border-primary-foreground/25 bg-primary-foreground/10 px-3 py-1 text-xs font-medium tracking-wide">
              Live online &amp; in-person in Lagos
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-6xl">
               Master the Skills Behind Tomorrow's Technology
            </h1>
            <p className="mt-5 max-w-xl text-lg text-primary-foreground/80">
              Develop job-ready technology skills through practical, hands-on training in AI, data,
              software development, cybersecurity, cloud computing, and more. Guided by industry professionals.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="cta" size="xl">
                <Link to="/courses">Explore Courses</Link>
              </Button>
              <Button asChild variant="onHero" size="xl">
                <Link to="/register">Register Now</Link>
              </Button>
            </div>
          </div>
          <img
            src={heroImg}
            alt="Students learning together at laptops in a technology training classroom"
            width={1600}
            height={1008}
            className="w-full rounded-3xl object-cover shadow-lift"
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-3xl font-bold">Why train with us</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {valueProps.map((v) => (
            <div key={v.title} className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <v.icon className="size-6 text-primary" />
              <h3 className="mt-4 text-lg font-semibold">{v.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-secondary/50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold">Two ways to learn</h2>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Same curriculum, same instructors choose the format that fits your schedule.
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-7 shadow-card">
              <Building2 className="size-7 text-primary" />
              <h3 className="mt-4 text-xl font-semibold">Physical class</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                In-person at our training centre, with weekend and weekday
                 options, and face-to-face mentoring.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-7 shadow-card">
              <Laptop className="size-7 text-primary" />
              <h3 className="mt-4 text-xl font-semibold">Live online</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Instructor-led virtual classes with recordings, you can learn from anywhere.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold">Course categories</h2>
            <p className="mt-2 text-muted-foreground">Disciplines, one practical approach.</p>
          </div>
          <Link
            to="/courses"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
          >
            View all courses <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to="/courses"
              search={{ category: cat.id }}
              className="group overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-lift"
            >
              <img
                src={cat.image}
                alt={cat.name}
                loading="lazy"
                width={1024}
                height={640}
                className="h-32 w-full object-cover"
              />
              <div className="p-5">
                <h3 className="text-base font-semibold">{cat.name}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{cat.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="text-3xl font-bold">Featured courses</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredCourses.map((course) => (
            <CourseCard key={course.slug} course={course} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-8">
        <div className="overflow-hidden rounded-3xl bg-hero-gradient px-6 py-14 text-center text-primary-foreground sm:px-12">
          <h2 className="text-3xl font-bold sm:text-4xl">Ready to start learning?</h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">
            Register your interest and our admissions team will call you with the next cohort dates,
            fees and payment options.
          </p>
          <Button asChild variant="cta" size="xl" className="mt-8">
            <Link to="/register">Register Now</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
