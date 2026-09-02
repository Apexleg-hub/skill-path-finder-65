import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  BarChart3,
  Bot,
  Brain,
  Briefcase,
  ChevronDown,
  Cpu,
  Database,
  FolderGit2,
  GraduationCap,
  HelpCircle,
  Layers,
  LineChart,
  MessageCircle,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/data-science-ai-course")({
  head: () => ({
    meta: [
      {
        title: "Data Science & AI Course in Lagos | Corepoint Tech Academy",
      },
      {
        name: "description",
        content:
          "Learn Data Science and Artificial Intelligence with Corepoint Tech Academy. Python, machine learning, real-world projects, and a portfolio you can show employers.",
      },
      {
        property: "og:title",
        content: "Data Science & AI Course | Corepoint Tech Academy",
      },
      {
        property: "og:description",
        content:
          "A practical, project-based Data Science and AI programme built for the Nigerian job market.",
      },
    ],
  }),
  component: DataScienceAiCoursePage,
});

const pillars = [
  {
    icon: Database,
    title: "Python & data fundamentals",
    description:
      "Programming basics, data cleaning, exploratory analysis, SQL, and visualization — the foundation every data role is built on.",
  },
  {
    icon: Brain,
    title: "Machine learning",
    description:
      "Regression, classification, clustering, model evaluation, and feature engineering using real datasets, not toy examples.",
  },
  {
    icon: Bot,
    title: "Artificial intelligence & generative AI",
    description:
      "Understand how modern AI systems work, and how to apply generative AI and automation to real business problems.",
  },
  {
    icon: FolderGit2,
    title: "Projects & portfolio",
    description:
      "Build a portfolio of real projects — churn prediction, forecasting, dashboards — that you can show employers and clients.",
  },
];

const stack = [
  "Python",
  "Pandas & NumPy",
  "SQL",
  "Power BI",
  "scikit-learn",
  "Matplotlib & Seaborn",
  "FastAPI",
  "Streamlit",
  "Git & GitHub",
];

const whoIsThisFor = [
  {
    icon: GraduationCap,
    title: "Students & graduates",
    description:
      "Build a strong foundation for a career in data science, analytics, or AI engineering — and graduate with a portfolio, not just a certificate.",
  },
  {
    icon: LineChart,
    title: "Analysts & existing data professionals",
    description:
      "Add machine learning and AI skills to your existing Excel, SQL, or reporting background and move into more advanced work.",
  },
  {
    icon: Briefcase,
    title: "Career changers",
    description:
      "Coming from a non-technical background? Start with the fundamentals and build up to real, demonstrable data and AI skills.",
  },
  {
    icon: Users,
    title: "Business owners & founders",
    description:
      "Understand how data and AI can be applied to your own business — from forecasting demand to automating decisions.",
  },
];

const careerRoles = [
  "Data Analyst",
  "Data Scientist",
  "Machine Learning Engineer",
  "AI Engineer",
  "Business Intelligence Analyst",
  "AI Automation Specialist",
];

const faqs = [
  {
    question: "Do I need a technical background to join?",
    answer:
      "No. The programme starts with Python and data fundamentals from the ground up. If you already write code, you'll move through the early modules faster and spend more time on machine learning and AI.",
  },
  {
    question: "How is Data Science different from the AI parts of this course?",
    answer:
      "Data Science covers how to collect, clean, analyze, and draw insight from data. AI builds on that foundation — using machine learning and generative AI to make predictions, automate tasks, and build intelligent applications. This programme teaches both, in sequence, so each skill builds on the last.",
  },
  {
    question: "Will I build real projects, or is this mostly theory?",
    answer:
      "Projects are central to this programme. You'll work with real datasets and build projects such as churn prediction, sales forecasting, and dashboards — the kind of work you can show in an interview or to a client.",
  },
  {
    question: "What will I be able to do after completing the course?",
    answer:
      "You'll be able to clean and analyze data, build and evaluate machine learning models, apply generative AI to practical problems, and present your findings clearly — backed by a portfolio of completed projects.",
  },
  {
    question: "How do I apply?",
    answer:
      "Click Apply Now, complete the application form, and our team will reach out with details on schedule, fees, and payment options.",
  },
];

function PillarCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Database;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
        <Icon className="size-6 text-primary" />
      </div>
      <h3 className="mt-5 text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function DataScienceAiCoursePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  function toggleFaq(index: number) {
    setOpenFaq(openFaq === index ? null : index);
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-hero-gradient text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:py-20">
          <div className="mx-auto flex max-w-fit items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-2 text-sm">
            <Sparkles className="size-4" />
            Data Science & AI Programme
          </div>

          <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Learn Data Science and AI.{" "}
            <span className="text-primary-foreground/80">
              Build a real portfolio.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-primary-foreground/80 sm:text-lg">
            A practical, project-based programme covering Python, machine
            learning, and artificial intelligence — built for the Nigerian
            job market, with real projects you can show employers.
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
              <Link to="/contact">Talk to Us</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why both */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
              <Layers className="size-6 text-primary" />
            </div>

            <p className="mt-5 text-sm font-semibold uppercase tracking-wider text-primary">
              Why Data Science and AI together
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              One builds on the other
            </h2>

            <p className="mt-4 text-muted-foreground">
              Data Science teaches you how to work with data: collecting,
              cleaning, analyzing, and drawing insight from it. AI takes that
              foundation further, using machine learning and generative AI to
              make predictions, automate decisions, and build intelligent
              applications. Most short courses only cover one. This programme
              takes you through both, in the right order, so each skill
              builds on the last.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
            <ul className="space-y-5">
              {[
                "Start with Python, statistics, and real data cleaning work",
                "Move into machine learning: regression, classification, clustering",
                "Apply generative AI and automation to practical problems",
                "Finish with a portfolio of real, demonstrable projects",
              ].map((step, index) => (
                <li key={step} className="flex items-start gap-3">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {index + 1}
                  </div>
                  <span className="text-sm leading-6 text-muted-foreground">
                    {step}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Curriculum pillars */}
      <section className="bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              Curriculum
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Built around four pillars
            </h2>
            <p className="mt-4 text-muted-foreground">
              Every module pairs theory with hands-on practice using real
              datasets.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map((pillar) => (
              <PillarCard key={pillar.title} {...pillar} />
            ))}
          </div>
        </div>
      </section>

      {/* Tool stack */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10">
            <Cpu className="size-6 text-primary" />
          </div>
          <p className="mt-5 text-sm font-semibold uppercase tracking-wider text-primary">
            Tools & technologies
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            What you'll actually work with
          </h2>
          <p className="mt-4 text-muted-foreground">
            You learn each tool in context, then use it across real projects
            — not just as a name on a slide.
          </p>
        </div>

        <div className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-3">
          {stack.map((tool) => (
            <span
              key={tool}
              className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium shadow-sm"
            >
              {tool}
            </span>
          ))}
        </div>
      </section>

      {/* Who is this for */}
      <section className="bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              Who this is for
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Built for different starting points
            </h2>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {whoIsThisFor.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex gap-4 rounded-2xl border border-border bg-card p-6 shadow-card"
                >
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="size-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold">{item.title}</h3>
                    <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Career outcomes */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
              <Target className="size-6 text-primary" />
            </div>
            <p className="mt-5 text-sm font-semibold uppercase tracking-wider text-primary">
              Career outcomes
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Roles this prepares you for
            </h2>
            <p className="mt-4 text-muted-foreground">
              Your exact path depends on your background going in — but this
              programme is built to make you credibly ready for these roles,
              backed by real project work.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              {careerRoles.map((role) => (
                <div key={role} className="flex items-center gap-3">
                  <BarChart3 className="size-4 shrink-0 text-primary" />
                  <span className="text-sm font-medium">{role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted/40">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:py-20">
          <div className="text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10">
              <HelpCircle className="size-6 text-primary" />
            </div>
            <p className="mt-5 text-sm font-semibold uppercase tracking-wider text-primary">
              Frequently Asked Questions
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Questions? We've got answers.
            </h2>
          </div>

          <div className="mt-10 space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;

              return (
                <div
                  key={faq.question}
                  className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition-colors hover:bg-muted/40"
                  >
                    <span className="font-semibold">{faq.question}</span>
                    <ChevronDown
                      className={`size-5 shrink-0 text-muted-foreground transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="border-t border-border px-5 pb-5 pt-4">
                      <p className="text-sm leading-7 text-muted-foreground">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-hero-gradient text-primary-foreground">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:py-20">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary-foreground/10">
            <MessageCircle className="size-6" />
          </div>

          <h2 className="mt-5 text-3xl font-bold sm:text-4xl">
            Ready to start building real skills?
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/80">
            Apply now to secure your spot in the next Data Science & AI
            cohort.
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
