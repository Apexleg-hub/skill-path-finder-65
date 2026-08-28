import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { CheckCircle2, Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

const west = 3.3657;
const south = 6.5193;
const east = 3.3757;
const north = 6.5293;

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us | Corepoint Tech Academy" },
      {
        name: "description",
        content:
          "Call, email or message Corepoint Tech Academy about course dates, fees and corporate training in Lagos or online.",
      },
      { property: "og:title", content: "Contact Corepoint Tech Academy" },
      {
        property: "og:description",
        content: "Questions about a course? Our team replies within one working day.",
      },
    ],
  }),
  component: ContactPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().email("Enter a valid email address").max(255),
  subject: z.string().trim().min(2, "Add a subject").max(150),
  message: z.string().trim().min(10, "Tell us a little more").max(1000),
});

type Errors = Partial<Record<"name" | "email" | "subject" | "message", string>>;

function ContactPage() {
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = e.currentTarget;
    const fd = new FormData(form);

    const parsed = schema.safeParse({
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      subject: String(fd.get("subject") ?? ""),
      message: String(fd.get("message") ?? ""),
    });

    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        next[issue.path[0] as keyof Errors] = issue.message;
      }
      setErrors(next);
      return;
    }

    setErrors({});

    const { error } = await supabase.from("contact_messages").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      subject: parsed.data.subject,
      message: parsed.data.message,
    });

    if (error) {
      console.error("Contact form submission error:", error);
      setErrors({
        message: "Unable to send your message. Please try again.",
      });
      return;
    }

    setSent(true);
    form.reset();
  }

  return (
    <div>
      <section className="bg-hero-gradient text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h1 className="text-4xl font-bold sm:text-5xl">Contact us</h1>
          <p className="mt-3 max-w-2xl text-primary-foreground/80">
            Ask about cohort dates, fees, corporate training or anything else. We reply within one
            working day.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="text-lg font-semibold">Reach us directly</h2>
            <ul className="mt-4 space-y-4 text-sm">
              <li className="flex gap-3">
                <Phone className="size-5 shrink-0 text-primary" />
                <span>
                  +234 911 575 1406
                  <br />
                  +234 911 575 1406 (WhatsApp)
                </span>
              </li>
              <li className="flex gap-3">
                <Mail className="size-5 shrink-0 text-primary" />
                <span>info@corepointtech.com.ng</span>
              </li>
              <li className="flex gap-3">
                <MapPin className="size-5 shrink-0 text-primary" />
                <span>Shomolu, Lagos, Nigeria</span>
              </li>
            </ul>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border shadow-card">
            <iframe
              title="Corepoint Tech Academy Lagos location map"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${west}%2C${south}%2C${east}%2C${north}&layer=mapnik`}
              className="h-72 w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>

        {sent ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-card">
            <CheckCircle2 className="mx-auto size-10 text-primary" />
            <h2 className="mt-4 text-xl font-semibold">Message received</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Thanks, we will be in touch shortly.
            </p>
            <Button className="mt-6" variant="outline" onClick={() => setSent(false)}>
              Send another message
            </Button>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            noValidate
            className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="c-name">Name</Label>
                <Input id="c-name" name="name" maxLength={100} />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-email">Email</Label>
                <Input id="c-email" name="email" type="email" maxLength={255} />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-subject">Subject</Label>
              <Input id="c-subject" name="subject" maxLength={150} />
              {errors.subject && <p className="text-xs text-destructive">{errors.subject}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-message">Message</Label>
              <Textarea id="c-message" name="message" rows={6} maxLength={1000} />
              {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
            </div>
            <Button type="submit" variant="cta" size="lg" className="w-full">
              Send message
            </Button>
          </form>
        )}
      </section>
    </div>
  );
}