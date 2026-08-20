import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Clock,
  CreditCard,
  HelpCircle,
  MessageCircle,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/payment-plans-and-faqs")({
  head: () => ({
    meta: [
      {
        title: "Payment Plans & FAQs | Corepoint Tech Academy",
      },
      {
        name: "description",
        content:
          "Explore Corepoint Tech Academy's flexible daily, weekly, monthly, and full-payment options, plus answers to frequently asked questions.",
      },
      {
        property: "og:title",
        content: "Payment Plans & FAQs | Corepoint Tech Academy",
      },
      {
        property: "og:description",
        content:
          "Choose a flexible payment option that works for you and learn more about Corepoint Tech Academy's training programmes.",
      },
    ],
  }),
  component: PaymentPlansPage,
});

const paymentPlans = [
  {
    title: "Daily Plan",
    subtitle: "Pay per class",
    description:
      "Maximum flexibility for learners who prefer to pay before each class.",
    icon: CalendarDays,
    features: [
      "Payment before each class",
      "2-hour session",
      "No long-term commitment",
      "Learn at your own pace",
    ],
    bestFor:
      "Beginners who want maximum flexibility and prefer to pay as they learn.",
  },
  {
    title: "Weekly Plan",
    subtitle: "Pay weekly",
    description:
      "A structured option for learners who can commit to regular weekly training.",
    icon: Clock,
    features: [
      "3 classes per week",
      "2 hours per class",
      "Payment once every week",
      "Structured weekly learning",
    ],
    bestFor:
      "Learners who can commit to a consistent weekly training schedule.",
    popular: true,
  },
  {
    title: "Monthly Plan",
    subtitle: "Pay monthly",
    description:
      "Spread your course fees across monthly instalments while maintaining a consistent schedule.",
    icon: Wallet,
    features: [
      "Monthly payment",
      "Structured monthly learning",
      "Spread course fees over time",
      "Consistent training schedule",
    ],
    bestFor:
      "Learners who want flexibility while maintaining a longer-term commitment.",
  },
  {
    title: "Full Payment",
    subtitle: "Pay once",
    description:
      "Pay the complete course fee upfront with no recurring payments.",
    icon: CreditCard,
    features: [
      "One-time payment",
      "No recurring payments",
      "Complete course payment",
      "Potential full-payment discount",
    ],
    bestFor:
      "Learners who are ready to commit to the complete programme.",
  },
];

const faqs = [
  {
    question: "Do I have to pay the full course fee at once?",
    answer:
      "No. Corepoint Tech offers daily, weekly, monthly, and full-payment options. You can choose the option that best suits your circumstances.",
  },
  {
    question: "How many classes are there each week?",
    answer:
      "The weekly programme consists of three sessions per week, with each session lasting approximately two hours.",
  },
  {
    question: "Can I pay daily?",
    answer:
      "Yes. Students who choose the daily plan can make payment before each scheduled class.",
  },
  {
    question: "Can I change my payment plan?",
    answer:
      "Payment plan changes can be requested before the next payment period. Changes are subject to the applicable training terms and availability.",
  },
  {
    question: "Are classes online or physical?",
    answer:
      "Our training is delivered online, allowing students to participate remotely from anywhere. Specific learning platforms and class access details will be communicated before training begins.",
  },
  {
    question: "Do I receive anything after completing the course?",
    answer:
      "Course completion benefits depend on the programme. Where applicable, students may receive certificates, practical projects, learning materials, or portfolio development support. Details will be provided for each course.",
  },
  {
    question: "What happens if I miss a class?",
    answer:
      "Missed classes and rescheduling are subject to Corepoint Tech's training policy. Please contact the training team as early as possible if you know you will be unable to attend a scheduled class.",
  },
  {
    question: "Can I stop my training after paying weekly or monthly?",
    answer:
      "Students should contact Corepoint Tech before the next payment period if they need to pause or discontinue training. Any applicable conditions will depend on the selected programme and payment arrangement.",
  },
  {
    question: "Can I get a refund?",
    answer:
      "Refund eligibility depends on the circumstances and the terms applicable to the selected programme. Please contact Corepoint Tech before making payment if you have questions about cancellation or refunds.",
  },
  {
    question: "How do I apply?",
    answer:
      "Click the Apply Now button, complete the application form, and our team will contact you with the next steps, including course availability, schedule, fees, and payment instructions.",
  },
];

function PaymentPlansPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  function toggleFaq(index: number) {
    setOpenFaq(openFaq === index ? null : index);
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-hero-gradient text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:py-20">
          <div className="mx-auto flex max-w-fit items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-2 text-sm">
            <Wallet className="size-4" />
            Flexible Payment Options
          </div>

          <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Flexible Learning.{" "}
            <span className="text-primary-foreground/80">
              Flexible Payment.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-primary-foreground/80 sm:text-lg">
            Choose a payment plan that works for you. Whether you prefer to
            pay per class, weekly, monthly, or in full, Corepoint Tech provides
            flexible options designed to make practical technology training
            accessible.
          </p>

          <div className="mt-8">
            <Button asChild size="lg" variant="cta">
              <Link to="/apply">Apply Now</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Payment Plans */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Payment Plans
          </p>

          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Choose what works for you
          </h2>

          <p className="mt-4 text-muted-foreground">
            Our payment options are designed to give you flexibility without
            compromising your learning experience.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {paymentPlans.map((plan) => {
            const Icon = plan.icon;

            return (
              <div
                key={plan.title}
                className={`relative flex flex-col rounded-2xl border bg-card p-6 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                  plan.popular
                    ? "border-primary ring-1 ring-primary/20"
                    : "border-border"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    Most Popular
                  </div>
                )}

                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="size-6 text-primary" />
                </div>

                <h3 className="mt-5 text-xl font-bold">{plan.title}</h3>

                <p className="mt-1 font-medium text-primary">
                  {plan.subtitle}
                </p>

                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {plan.description}
                </p>

                <div className="my-6 h-px bg-border" />

                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm"
                    >
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Best for
                  </p>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {plan.bestFor}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Payment Frequency */}
      <section className="bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              Payment Frequency
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Simple and transparent
            </h2>

            <p className="mt-4 text-muted-foreground">
              Choose how frequently you would like to make your training
              payments.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <div className="grid grid-cols-2 bg-muted/60 px-6 py-4 text-sm font-semibold">
              <span>Frequency</span>
              <span>Payment</span>
            </div>

            <div className="divide-y divide-border">
              <div className="grid grid-cols-2 px-6 py-5 text-sm">
                <span className="font-medium">Daily</span>
                <span className="text-muted-foreground">
                  Before each class
                </span>
              </div>

              <div className="grid grid-cols-2 px-6 py-5 text-sm">
                <span className="font-medium">Weekly</span>
                <span className="text-muted-foreground">
                  Once every week
                </span>
              </div>

              <div className="grid grid-cols-2 px-6 py-5 text-sm">
                <span className="font-medium">Monthly</span>
                <span className="text-muted-foreground">
                  Once every month
                </span>
              </div>

              <div className="grid grid-cols-2 px-6 py-5 text-sm">
                <span className="font-medium">Full Payment</span>
                <span className="text-muted-foreground">
                  One-time payment
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Payment Terms */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
              <ShieldCheck className="size-6 text-primary" />
            </div>

            <p className="mt-5 text-sm font-semibold uppercase tracking-wider text-primary">
              Payment Terms
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Clear terms before you begin
            </h2>

            <p className="mt-4 text-muted-foreground">
              We believe students should understand their payment
              arrangements before training begins.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
            <ul className="space-y-5">
              {[
                "Training fees must be paid before the applicable training period begins.",
                "Weekly payments cover three sessions within that week.",
                "Monthly payments cover the agreed monthly training period.",
                "Full payment covers the complete course according to the selected programme.",
                "Missed classes and rescheduling are subject to Corepoint Tech's training policy.",
                "Course fees and payment schedules will be clearly communicated before training begins.",
              ].map((term) => (
                <li key={term} className="flex items-start gap-3">
                  <Check className="mt-0.5 size-5 shrink-0 text-primary" />
                  <span className="text-sm leading-6 text-muted-foreground">
                    {term}
                  </span>
                </li>
              ))}
            </ul>
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

            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Find answers to common questions about payments, classes,
              scheduling, and applications.
            </p>
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
            Ready to start learning?
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/80">
            Choose your preferred payment option and take the next step toward
            building practical technology skills.
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