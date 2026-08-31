
import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, HeartHandshake, Target, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-training.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      {
        title: "About Corepoint Tech | Technology & AI Training in Nigeria",
      },
      {
        name: "description",
        content:
          "Learn about Corepoint Tech, a technology education and innovation platform helping individuals and businesses across Nigeria and Africa build practical skills in AI, data, software development, cybersecurity, and emerging technologies.",
      },
      {
        property: "og:title",
        content: "About Corepoint Tech",
      },
      {
        property: "og:description",
        content:
          "Corepoint Tech empowers individuals and businesses with practical technology education, innovative solutions, and skills for the digital economy.",
      },
    ],
  }),
  component: AboutPage,
});

const values = [
  {
    icon: Users,
    title: "Personalized Learning",
    body:
      "We keep our learning experience practical and engaging, giving learners the guidance, feedback, and support they need to make real progress.",
  },
  {
    icon: Target,
    title: "Project-Based Learning",
    body:
      "You learn by building. Our programmes focus on practical projects, real-world datasets, and hands-on technology applications.",
  },
  {
    icon: Award,
    title: "Industry-Relevant Skills",
    body:
      "Our training focuses on modern tools, technologies, and practices that help learners prepare for today's rapidly changing digital economy.",
  },
  {
    icon: HeartHandshake,
    title: "Career & Business Growth",
    body:
      "We help individuals turn technology skills into career opportunities, while helping businesses discover ways technology can improve growth and productivity.",
  },
];

function AboutPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-hero-gradient text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h1 className="text-4xl font-bold sm:text-5xl">
            About Corepoint Tech
          </h1>

          <p className="mt-4 max-w-2xl text-primary-foreground/80">
            Empowering individuals and businesses with the technology,
            knowledge, and practical skills needed to thrive in a rapidly
            evolving digital world.
          </p>
        </div>
      </section>

      {/* Our Story & Mission */}
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-2 lg:items-center">
        <img
          src={heroImg}
          alt="Students working together during a Corepoint Tech technology training session"
          loading="lazy"
          width={1600}
          height={1008}
          className="rounded-2xl object-cover shadow-lift"
        />

        <div>
          <h2 className="text-3xl font-bold">Our Story</h2>

          <p className="mt-4 text-muted-foreground">
            Corepoint Tech was created from a simple belief: Africa's future
            will be shaped by technology, and everyone should have the
            opportunity to be part of it.
          </p>

          <p className="mt-4 text-muted-foreground">
            What started as a small learning community for people looking to
            build practical technology skills has grown into a technology
            education and innovation platform focused on helping individuals
            and businesses learn, adopt, and leverage technology to create new
            opportunities and solve real-world problems.
          </p>

          <p className="mt-4 text-muted-foreground">
            As technology continues to transform industries across Nigeria and
            Africa, we believe the greatest opportunity is not simply to use
            technology, but to understand it, build with it, innovate with it,
            and use it to create sustainable growth.
          </p>

          <p className="mt-4 text-muted-foreground">
            Corepoint Tech provides practical training and technology-focused
            solutions across Artificial Intelligence, Data Science, Data
            Analytics, Software Development, Cybersecurity, and other emerging
            technologies.
          </p>

          <p className="mt-4 text-muted-foreground">
            Our approach is practical and results-driven. We combine hands-on
            learning, real-world projects, expert guidance, and continuous
            innovation to help individuals develop skills that can lead to
            careers, businesses, and new ventures.
          </p>

          <p className="mt-4 text-muted-foreground">
            For businesses, we help organizations understand and adopt
            technology that can improve productivity, decision-making,
            automation, efficiency, and competitiveness.
          </p>

          <p className="mt-4 text-muted-foreground">
            Our vision goes beyond training. We want to contribute to a more
            technologically skilled, innovative, and digitally empowered
            Nigeria and Africa, where individuals can build global careers,
            entrepreneurs can create technology-driven businesses, and
            organizations can use innovation to grow.
          </p>

          <p className="mt-4 font-medium">
            We are building for the future of Nigeria and Africa, one skill,
            one solution, and one innovation at a time.
          </p>

          <h2 className="mt-10 text-3xl font-bold">Our Mission</h2>

          <p className="mt-4 text-muted-foreground">
            To empower individuals and businesses across Africa with practical
            technology education, innovative solutions, and the skills needed
            to thrive in a digital economy.
          </p>
        </div>
      </section>

      {/* Why Corepoint Tech */}
      <section className="bg-secondary/50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold">Why Corepoint Tech</h2>

          <p className="mt-3 max-w-2xl text-muted-foreground">
            We combine practical education, modern technology, and real-world
            applications to help people and organizations turn knowledge into
            meaningful results.
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => {
              const Icon = value.icon;

              return (
                <div
                  key={value.title}
                  className="rounded-2xl border border-border bg-card p-6 shadow-card"
                >
                  <Icon className="size-6 text-primary" />

                  <h3 className="mt-4 text-lg font-semibold">
                    {value.title}
                  </h3>

                  <p className="mt-2 text-sm text-muted-foreground">
                    {value.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h2 className="text-3xl font-bold">
          Start Building Your Future with Technology
        </h2>

        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Explore our programmes and discover the technology skills that can
          help you advance your career, grow your business, or build your next
          idea.
        </p>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button asChild variant="cta" size="lg">
            <Link to="/courses">Explore Our Courses</Link>
          </Button>

          <Button asChild variant="outline" size="lg">
            <Link to="/contact">Talk to Us</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
