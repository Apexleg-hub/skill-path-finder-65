import { useState } from "react";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { courses } from "@/data/courses";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email address").max(255),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(20)
    .regex(/^[0-9+()\-\s]+$/, "Phone can only contain digits and + ( ) -"),
  course: z.string().min(1, "Choose a course"),
  delivery: z.enum(["Physical", "Live Online"]),
  message: z.string().trim().max(1000, "Message is too long").optional(),
});

type Errors = Partial<Record<keyof z.infer<typeof schema>, string>>;

export function RegistrationForm({ defaultCourse }: { defaultCourse?: string | undefined }) {
  const [course, setCourse] = useState(defaultCourse ?? "");
  const [delivery, setDelivery] = useState("Live Online");
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      course,
      delivery,
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
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-card">
        <CheckCircle2 className="mx-auto size-10 text-primary" />
        <h3 className="mt-4 text-xl font-semibold">Thanks — we&apos;ll be in touch shortly</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Your registration interest has been recorded. A member of our admissions team will call
          or email you within one working day with the next cohort dates and fees.
        </p>
        <Button className="mt-6" variant="outline" onClick={() => setSubmitted(false)}>
          Register another interest
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" name="name" maxLength={100} placeholder="Ada Obi" />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" maxLength={255} placeholder="ada@email.com" />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone number</Label>
        <Input id="phone" name="phone" maxLength={20} placeholder="+234 800 000 0000" />
        {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="course">Course you&apos;re interested in</Label>
        <Select value={course} onValueChange={setCourse}>
          <SelectTrigger id="course">
            <SelectValue placeholder="Select a course" />
          </SelectTrigger>
          <SelectContent>
            {courses.map((c) => (
              <SelectItem key={c.slug} value={c.title}>
                {c.title}
              </SelectItem>
            ))}
            <SelectItem value="Not sure yet">Not sure yet — advise me</SelectItem>
          </SelectContent>
        </Select>
        {errors.course && <p className="text-xs text-destructive">{errors.course}</p>}
      </div>

      <div className="space-y-2">
        <Label>Preferred delivery method</Label>
        <RadioGroup value={delivery} onValueChange={setDelivery} className="flex gap-6 pt-1">
          <div className="flex items-center gap-2">
            <RadioGroupItem value="Live Online" id="d-online" />
            <Label htmlFor="d-online" className="font-normal">Live Online</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="Physical" id="d-physical" />
            <Label htmlFor="d-physical" className="font-normal">Physical Class</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Message (optional)</Label>
        <Textarea
          id="message"
          name="message"
          maxLength={1000}
          rows={4}
          placeholder="Tell us about your background or preferred start date"
        />
        {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
      </div>

      <Button type="submit" variant="cta" size="lg" className="w-full">
        Register Now
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        No payment required. We&apos;ll contact you to confirm your place.
      </p>
    </form>
  );
}