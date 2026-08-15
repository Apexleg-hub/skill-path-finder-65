import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
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
import {
  EXPERIENCE_LEVELS,
  LEARNING_FORMATS,
  SCHEDULES,
  SOURCES,
  applicationSchema,
  type CourseApplicationInput,
} from "@/lib/applications";
import { submitCourseApplication } from "@/lib/applications.functions";

type Errors = Partial<Record<keyof CourseApplicationInput, string>>;

const NONE = "__none__";

export function RegistrationForm({ defaultCourse }: { defaultCourse?: string | undefined }) {
  const submit = useServerFn(submitCourseApplication);
  const [course, setCourse] = useState(defaultCourse ?? "");
  const [delivery, setDelivery] = useState("Live Online");
  const [experience, setExperience] = useState(NONE);
  const [schedule, setSchedule] = useState(NONE);
  const [source, setSource] = useState(NONE);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [failed, setFailed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;

    const form = e.currentTarget;
    const fd = new FormData(form);
    const parsed = applicationSchema.safeParse({
      full_name: String(fd.get("full_name") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      course,
      learning_format: delivery,
      experience_level: experience === NONE ? undefined : experience,
      preferred_schedule: schedule === NONE ? undefined : schedule,
      source: source === NONE ? undefined : source,
      occupation: String(fd.get("occupation") ?? "") || undefined,
      message: String(fd.get("message") ?? "") || undefined,
    });

    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        next[issue.path[0] as keyof Errors] = issue.message;
      }
      setErrors(next);
      setFailed(false);
      return;
    }

    setErrors({});
    setFailed(false);
    setSubmitting(true);
    try {
      const result = await submit({ data: parsed.data });
      if (result.ok) {
        form.reset();
        setCourse(defaultCourse ?? "");
        setDelivery("Live Online");
        setExperience(NONE);
        setSchedule(NONE);
        setSource(NONE);
        setSubmitted(true);
      } else {
        setFailed(true);
      }
    } catch {
      setFailed(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-card">
        <CheckCircle2 className="mx-auto size-10 text-primary" />
        <h3 className="mt-4 text-xl font-semibold">Application Submitted Successfully!</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Thank you for your interest. Our team will contact you shortly with information about the
          course, schedule, instructor, and next steps.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild variant="cta">
            <Link to="/courses">Explore More Courses</Link>
          </Button>
          <Button variant="outline" onClick={() => setSubmitted(false)}>
            Apply for another course
          </Button>
        </div>
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
          <Label htmlFor="full_name">Full name</Label>
          <Input id="full_name" name="full_name" maxLength={100} placeholder="Ada Obi" />
          {errors.full_name && <p className="text-xs text-destructive">{errors.full_name}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" maxLength={255} placeholder="ada@email.com" />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone / WhatsApp number</Label>
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
        <Label>Preferred learning format</Label>
        <RadioGroup value={delivery} onValueChange={setDelivery} className="flex gap-6 pt-1">
          {LEARNING_FORMATS.map((f) => (
            <div key={f} className="flex items-center gap-2">
              <RadioGroupItem value={f} id={`d-${f}`} />
              <Label htmlFor={`d-${f}`} className="font-normal">
                {f === "Physical" ? "Physical Class" : f}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="experience">Experience level (optional)</Label>
          <Select value={experience} onValueChange={setExperience}>
            <SelectTrigger id="experience">
              <SelectValue placeholder="Select your level" />
            </SelectTrigger>
            <SelectContent>
              {EXPERIENCE_LEVELS.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="schedule">Preferred schedule (optional)</Label>
          <Select value={schedule} onValueChange={setSchedule}>
            <SelectTrigger id="schedule">
              <SelectValue placeholder="Select a schedule" />
            </SelectTrigger>
            <SelectContent>
              {SCHEDULES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="occupation">Current occupation (optional)</Label>
          <Input id="occupation" name="occupation" maxLength={120} placeholder="Student, Analyst…" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="source">How did you hear about us? (optional)</Label>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger id="source">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {SOURCES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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

      {failed && (
        <div className="flex gap-2.5 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div>
            <p className="text-sm font-semibold text-destructive">Something went wrong</p>
            <p className="text-xs text-muted-foreground">
              We could not submit your application at this time. Please try again or contact us
              directly.
            </p>
          </div>
        </div>
      )}

      <Button type="submit" variant="cta" size="lg" className="w-full" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Submitting...
          </>
        ) : (
          "Submit Application"
        )}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        By submitting this form, you agree that we may contact you regarding your course application
        and training opportunities.
      </p>
    </form>
  );
}