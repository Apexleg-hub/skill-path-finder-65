// Save as src/components/admin/CohortEditor.tsx
import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  cohortError,
  fetchCohortForEdit,
  saveCohort,
  saveCurriculum,
  slugify,
  uploadCohortImage,
  type CohortInput,
  type ModuleDraft,
} from "@/lib/cohort-admin";

type Faq = { q: string; a: string };

type Form = {
  programme_name: string;
  cohort_number: string;
  title: string;
  slug: string;
  description: string;
  about: string;
  category: string;
  skills: string; // one per line
  image_url: string;
  duration_weeks: string;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  payment_deadline: string;
  seat_hold_hours: string;
  learning_format: "virtual" | "physical" | "hybrid";
  class_schedule: string;
  tuition_fee: string;
  early_bird_fee: string;
  early_bird_deadline: string;
  seat_capacity: string;
  faqs: Faq[];
  modules: ModuleDraft[];
};

const EMPTY: Form = {
  programme_name: "", cohort_number: "1", title: "", slug: "", description: "", about: "", category: "",
  skills: "", image_url: "", duration_weeks: "", start_date: "", end_date: "", registration_deadline: "",
  payment_deadline: "", seat_hold_hours: "48",
  learning_format: "virtual", class_schedule: "", tuition_fee: "", early_bird_fee: "", early_bird_deadline: "",
  seat_capacity: "", faqs: [], modules: [],
};

const EMPTY_MODULE: ModuleDraft = {
  week_number: "", module_title: "", module_description: "", topics: "", objectives: "", assignment: "",
};

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

const num = (s: string) => (s.trim() === "" ? null : Number(s));
const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);

export function CohortEditor({
  cohortId,
  onDone,
  onCancel,
}: {
  cohortId: string | null;
  onDone: (id: string) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Form>(EMPTY);
  const [loading, setLoading] = useState(Boolean(cohortId));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(Boolean(cohortId));
  const [published, setPublished] = useState(false);

  useEffect(() => {
    if (!cohortId) return;
    let active = true;
    fetchCohortForEdit(cohortId)
      .then(({ cohort: c, modules }) => {
        if (!active) return;
        setPublished(c.publication_status === "published");
        setForm({
          programme_name: c.programme_name, cohort_number: String(c.cohort_number), title: c.title, slug: c.slug,
          description: c.description ?? "", about: c.about ?? "", category: c.category ?? "",
          skills: c.skills.join("\n"), image_url: c.image_url ?? "",
          duration_weeks: c.duration_weeks?.toString() ?? "", start_date: c.start_date ?? "", end_date: c.end_date ?? "",
          registration_deadline: c.registration_deadline ?? "", payment_deadline: c.payment_deadline ?? "",
          seat_hold_hours: String(c.seat_hold_hours ?? 48), learning_format: c.learning_format,
          class_schedule: c.class_schedule ?? "", tuition_fee: c.tuition_fee?.toString() ?? "",
          early_bird_fee: c.early_bird_fee?.toString() ?? "", early_bird_deadline: c.early_bird_deadline ?? "",
          seat_capacity: c.seat_capacity?.toString() ?? "",
          faqs: c.faqs, modules,
        });
      })
      .catch((e) => active && setError(cohortError(e)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [cohortId]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  // New cohorts get a web address from the programme name and batch number until you edit it.
  useEffect(() => {
    if (slugTouched || cohortId) return;
    const base = slugify(form.programme_name);
    setForm((f) => ({ ...f, slug: base ? `${base}-cohort-${f.cohort_number || 1}` : "" }));
  }, [form.programme_name, form.cohort_number, slugTouched, cohortId]);

  async function onImage(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      set("image_url", await uploadCohortImage(file));
    } catch (e) {
      setError(cohortError(e));
    } finally {
      setUploading(false);
    }
  }

  function validate(): string | null {
    if (form.programme_name.trim().length < 2) return "Enter the programme name.";
    if (form.title.trim().length < 2) return "Enter the cohort title.";
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(form.slug)) return "The web address can only use lowercase letters, numbers and hyphens.";
    const n = Number(form.cohort_number);
    if (!Number.isInteger(n) || n < 1) return "The batch number must be a whole number of 1 or more.";
    for (const [label, v] of [
      ["Duration", form.duration_weeks], ["Tuition fee", form.tuition_fee],
      ["Early-bird fee", form.early_bird_fee], ["Seat capacity", form.seat_capacity],
    ] as const) {
      if (v.trim() !== "" && (!Number.isFinite(Number(v)) || Number(v) < 0)) return `${label} must be a positive number.`;
    }
    if (form.seat_capacity.trim() !== "" && Number(form.seat_capacity) < 1) return "Seat capacity must be at least 1, or left empty for no limit.";
    const hold = Number(form.seat_hold_hours);
    if (!Number.isInteger(hold) || hold < 1 || hold > 720) return "Seat hold must be a whole number of hours between 1 and 720.";
    if (form.payment_deadline && form.registration_deadline && form.payment_deadline < form.registration_deadline)
      return "The payment deadline cannot be before the registration deadline.";
    if (form.start_date && form.end_date && form.end_date < form.start_date) return "The end date cannot be before the start date.";
    if (form.early_bird_fee.trim() !== "" && form.tuition_fee.trim() !== "" && Number(form.early_bird_fee) > Number(form.tuition_fee))
      return "The early-bird fee cannot be higher than the standard tuition.";
    if (form.early_bird_fee.trim() !== "" && !form.early_bird_deadline) return "Set a deadline for the early-bird fee, or clear the fee.";
    if (form.modules.some((m) => m.module_title.trim() === "")) return "Every curriculum module needs a title.";
    if (form.faqs.some((f) => (f.q.trim() === "") !== (f.a.trim() === ""))) return "Each FAQ needs both a question and an answer.";
    return null;
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    const problem = validate();
    if (problem) {
      setError(problem);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const input: CohortInput = {
        programme_name: form.programme_name.trim(),
        slug: form.slug,
        cohort_number: Number(form.cohort_number),
        title: form.title.trim(),
        description: form.description.trim() || null,
        about: form.about.trim() || null,
        image_url: form.image_url || null,
        category: form.category.trim() || null,
        skills: lines(form.skills),
        duration_weeks: num(form.duration_weeks),
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        registration_deadline: form.registration_deadline || null,
        payment_deadline: form.payment_deadline || null,
        seat_hold_hours: Number(form.seat_hold_hours),
        learning_format: form.learning_format,
        class_schedule: form.class_schedule.trim() || null,
        tuition_fee: num(form.tuition_fee),
        early_bird_fee: num(form.early_bird_fee),
        early_bird_deadline: form.early_bird_deadline || null,
        seat_capacity: num(form.seat_capacity),
        payment_options: ["full"], // full payment only
        faqs: form.faqs.filter((f) => f.q.trim() && f.a.trim()).map((f) => ({ q: f.q.trim(), a: f.a.trim() })),
      };
      const id = await saveCohort(input, cohortId ?? undefined);
      await saveCurriculum(id, form.modules);
      onDone(id);
    } catch (err) {
      setError(cohortError(err));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  }

  const updateModule = (i: number, patch: Partial<ModuleDraft>) =>
    set("modules", form.modules.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
  const moveModule = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= form.modules.length) return;
    const next = [...form.modules];
    [next[i], next[j]] = [next[j], next[i]];
    set("modules", next);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground" role="status">
        <Loader2 className="size-4 animate-spin" /> Loading cohort...
      </div>
    );
  }

  return (
    <form onSubmit={onSave} noValidate className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">{cohortId ? "Edit cohort" : "New cohort"}</h2>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
          <Button type="submit" variant="cta" disabled={saving || uploading}>
            {saving ? (<><Loader2 className="size-4 animate-spin" /> Saving...</>) : "Save cohort"}
          </Button>
        </div>
      </div>

      <div aria-live="polite">
        {error && (
          <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm font-medium text-destructive">
            {error}
          </p>
        )}
      </div>

      {!cohortId && (
        <p className="rounded-md bg-secondary/60 p-3 text-sm text-muted-foreground">
          New cohorts are saved as drafts and are not visible to the public. Publish and open registration from the cohort list when
          the dates and fees are confirmed.
        </p>
      )}

      <Section title="Basics">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Programme name"><input className={inputClass} value={form.programme_name} onChange={(e) => set("programme_name", e.target.value)} placeholder="Data Analysis" /></Field>
          <Field label="Batch number"><input className={inputClass} inputMode="numeric" value={form.cohort_number} onChange={(e) => set("cohort_number", e.target.value)} /></Field>
        </div>
        <Field label="Cohort title"><input className={inputClass} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Data Analysis Cohort" /></Field>
        <Field label="Web address" hint={published ? "Locked because this cohort is published. Unpublish it to change the address." : `Appears as /cohorts/${form.slug || "..."}`}>
          <input className={inputClass} value={form.slug} readOnly={published}
            onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} />
        </Field>
        <Field label="Category" hint="Used for the category filter, for example Data Analytics & Business Intelligence.">
          <input className={inputClass} value={form.category} onChange={(e) => set("category", e.target.value)} />
        </Field>
        <Field label="Short description" hint="Shown on cards and in search previews.">
          <textarea rows={2} className={inputClass} value={form.description} onChange={(e) => set("description", e.target.value)} />
        </Field>
      </Section>

      <Section title="Programme content">
        <Field label="About the programme" hint="Leave a blank line between paragraphs.">
          <textarea rows={8} className={inputClass} value={form.about} onChange={(e) => set("about", e.target.value)} />
        </Field>
        <Field label="What you will learn" hint="One skill or tool per line. Each becomes a card.">
          <textarea rows={5} className={inputClass} value={form.skills} onChange={(e) => set("skills", e.target.value)} />
        </Field>
        <div>
          <span className="mb-1 block text-sm font-medium">Course image</span>
          {form.image_url && <img src={form.image_url} alt="Course preview" className="mb-2 h-32 w-auto rounded-lg object-cover" />}
          <div className="flex flex-wrap items-center gap-3">
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => onImage(e.target.files?.[0])}
              disabled={uploading} aria-label="Upload course image" className="text-sm" />
            {uploading && <Loader2 className="size-4 animate-spin" />}
            {form.image_url && <button type="button" className="text-sm font-semibold text-primary" onClick={() => set("image_url", "")}>Remove image</button>}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">JPG, PNG or WebP, up to 2 MB. A landscape image works best.</p>
        </div>
      </Section>

      <Section title="Schedule and fees">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Start date"><input type="date" className={inputClass} value={form.start_date} onChange={(e) => set("start_date", e.target.value)} /></Field>
          <Field label="End date"><input type="date" className={inputClass} value={form.end_date} onChange={(e) => set("end_date", e.target.value)} /></Field>
          <Field label="Registration deadline"><input type="date" className={inputClass} value={form.registration_deadline} onChange={(e) => set("registration_deadline", e.target.value)} /></Field>
          <Field label="Payment deadline" hint="Last day to pay. Leave empty to use the registration deadline."><input type="date" className={inputClass} value={form.payment_deadline} onChange={(e) => set("payment_deadline", e.target.value)} /></Field>
          <Field label="Duration (weeks)"><input className={inputClass} inputMode="numeric" value={form.duration_weeks} onChange={(e) => set("duration_weeks", e.target.value)} /></Field>
          <Field label="Learning format">
            <select className={inputClass} value={form.learning_format} onChange={(e) => set("learning_format", e.target.value as Form["learning_format"])}>
              <option value="virtual">Virtual</option>
              <option value="physical">Physical</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </Field>
          <Field label="Seat capacity" hint="Leave empty for no limit."><input className={inputClass} inputMode="numeric" value={form.seat_capacity} onChange={(e) => set("seat_capacity", e.target.value)} /></Field>
          <Field label="Seat hold (hours)" hint="How long an unpaid registration keeps its seat."><input className={inputClass} inputMode="numeric" value={form.seat_hold_hours} onChange={(e) => set("seat_hold_hours", e.target.value)} /></Field>
        </div>
        <Field label="Class schedule"><input className={inputClass} value={form.class_schedule} onChange={(e) => set("class_schedule", e.target.value)} placeholder="Days and times" /></Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Tuition fee (NGN)"><input className={inputClass} inputMode="decimal" value={form.tuition_fee} onChange={(e) => set("tuition_fee", e.target.value)} /></Field>
          <Field label="Early-bird fee (NGN)" hint="Optional."><input className={inputClass} inputMode="decimal" value={form.early_bird_fee} onChange={(e) => set("early_bird_fee", e.target.value)} /></Field>
          <Field label="Early-bird deadline"><input type="date" className={inputClass} value={form.early_bird_deadline} onChange={(e) => set("early_bird_deadline", e.target.value)} /></Field>
        </div>
        <p className="rounded-md bg-secondary/60 p-3 text-sm text-muted-foreground">Payment: full tuition is paid online with Paystack. Part payments and instalments are not offered.</p>
      </Section>

      <Section title="Curriculum">
        {form.modules.length === 0 && <p className="text-sm text-muted-foreground">No modules yet. The curriculum section stays hidden on the public page until you add one.</p>}
        {form.modules.map((m, i) => (
          <div key={i} className="space-y-3 rounded-xl border border-border p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold">Module {i + 1}</span>
              <div className="flex gap-1">
                <Button type="button" size="sm" variant="outline" onClick={() => moveModule(i, -1)} disabled={i === 0} aria-label="Move up"><ArrowUp className="size-4" /></Button>
                <Button type="button" size="sm" variant="outline" onClick={() => moveModule(i, 1)} disabled={i === form.modules.length - 1} aria-label="Move down"><ArrowDown className="size-4" /></Button>
                <Button type="button" size="sm" variant="outline" onClick={() => set("modules", form.modules.filter((_, idx) => idx !== i))} aria-label="Remove module"><Trash2 className="size-4" /></Button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-[100px_1fr]">
              <Field label="Week"><input className={inputClass} inputMode="numeric" value={m.week_number} onChange={(e) => updateModule(i, { week_number: e.target.value })} placeholder={String(i + 1)} /></Field>
              <Field label="Module title"><input className={inputClass} value={m.module_title} onChange={(e) => updateModule(i, { module_title: e.target.value })} /></Field>
            </div>
            <Field label="Description"><textarea rows={2} className={inputClass} value={m.module_description} onChange={(e) => updateModule(i, { module_description: e.target.value })} /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Topics covered" hint="One per line."><textarea rows={4} className={inputClass} value={m.topics} onChange={(e) => updateModule(i, { topics: e.target.value })} /></Field>
              <Field label="Learning objectives" hint="One per line."><textarea rows={4} className={inputClass} value={m.objectives} onChange={(e) => updateModule(i, { objectives: e.target.value })} /></Field>
            </div>
            <Field label="Practical assignment or project"><input className={inputClass} value={m.assignment} onChange={(e) => updateModule(i, { assignment: e.target.value })} /></Field>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" disabled={form.modules.length >= 60}
          onClick={() => set("modules", [...form.modules, { ...EMPTY_MODULE, week_number: String(form.modules.length + 1) }])}>
          <Plus className="size-4" /> Add module
        </Button>
      </Section>

      <Section title="Frequently asked questions">
        {form.faqs.length === 0 && <p className="text-sm text-muted-foreground">No FAQs yet. The section stays hidden on the public page until you add one.</p>}
        {form.faqs.map((f, i) => (
          <div key={i} className="space-y-2 rounded-xl border border-border p-4">
            <Field label={`Question ${i + 1}`}><input className={inputClass} value={f.q} onChange={(e) => set("faqs", form.faqs.map((x, idx) => (idx === i ? { ...x, q: e.target.value } : x)))} /></Field>
            <Field label="Answer"><textarea rows={3} className={inputClass} value={f.a} onChange={(e) => set("faqs", form.faqs.map((x, idx) => (idx === i ? { ...x, a: e.target.value } : x)))} /></Field>
            <Button type="button" size="sm" variant="outline" onClick={() => set("faqs", form.faqs.filter((_, idx) => idx !== i))}><Trash2 className="size-4" /> Remove</Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" disabled={form.faqs.length >= 20} onClick={() => set("faqs", [...form.faqs, { q: "", a: "" }])}>
          <Plus className="size-4" /> Add FAQ
        </Button>
      </Section>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button type="submit" variant="cta" disabled={saving || uploading}>
          {saving ? (<><Loader2 className="size-4 animate-spin" /> Saving...</>) : "Save cohort"}
        </Button>
      </div>
    </form>
  );
}
