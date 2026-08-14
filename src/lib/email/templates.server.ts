import type { CourseApplicationInput } from "../applications";

const BRAND = "Skill Path Finder";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function value(input?: string): string {
  return escapeHtml(input && input.trim() !== "" ? input : "Not provided");
}

function shell(inner: string): string {
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f5f6f8;font-family:Arial,Helvetica,sans-serif;color:#1a1c1e;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;padding:28px;">
    ${inner}
    <hr style="border:none;border-top:1px solid #e6e8eb;margin:28px 0 16px;" />
    <p style="font-size:12px;color:#6b7280;margin:0;">${BRAND}</p>
  </div>
</body></html>`;
}

function row(label: string, val?: string): string {
  return `<p style="margin:4px 0;font-size:14px;"><strong>${escapeHtml(label)}:</strong> ${value(val)}</p>`;
}

export function adminEmail(app: CourseApplicationInput, createdAt: string) {
  return {
    subject: `New Course Application — ${app.course}`,
    html: shell(`
      <h1 style="font-size:20px;margin:0 0 8px;">New Course Application</h1>
      <p style="font-size:14px;color:#4b5563;margin:0 0 20px;">A new student has submitted a course application.</p>

      <h2 style="font-size:15px;margin:20px 0 6px;">Student Information</h2>
      ${row("Name", app.full_name)}
      ${row("Email", app.email)}
      ${row("Phone", app.phone)}

      <h2 style="font-size:15px;margin:20px 0 6px;">Course</h2>
      ${row("Course", app.course)}

      <h2 style="font-size:15px;margin:20px 0 6px;">Learning Information</h2>
      ${row("Experience Level", app.experience_level)}
      ${row("Preferred Format", app.learning_format)}
      ${row("Preferred Schedule", app.preferred_schedule)}
      ${row("Occupation", app.occupation)}

      <h2 style="font-size:15px;margin:20px 0 6px;">Message</h2>
      <p style="font-size:14px;margin:4px 0;white-space:pre-wrap;">${value(app.message)}</p>

      <h2 style="font-size:15px;margin:20px 0 6px;">Source</h2>
      <p style="font-size:14px;margin:4px 0;">${value(app.source)}</p>

      ${row("Application Date", createdAt)}
      ${row("Status", "New")}
    `),
  };
}

export function studentEmail(app: CourseApplicationInput) {
  return {
    subject: `Application Received — ${app.course}`,
    html: shell(`
      <p style="font-size:15px;">Hello ${escapeHtml(app.full_name)},</p>
      <p style="font-size:15px;">Thank you for your interest in <strong>${escapeHtml(app.course)}</strong>.</p>
      <p style="font-size:15px;">We have received your application successfully.</p>
      <p style="font-size:15px;">Our team will review your information and contact you shortly with the next steps, including course schedule, instructor information, and training details.</p>
      ${row("Course", app.course)}
      ${row("Preferred Schedule", app.preferred_schedule)}
      ${row("Preferred Format", app.learning_format)}
      <p style="font-size:15px;">We look forward to helping you develop your technology skills.</p>
      <p style="font-size:15px;margin-bottom:0;">Best regards,<br/>${BRAND}</p>
    `),
  };
}