//applications.functions.ts
import { createServerFn } from "@tanstack/react-start";

import {
  GENERIC_SUBMIT_ERROR,
  applicationSchema,
  type CourseApplicationInput,
  type SubmitApplicationResult,
} from "./applications";

export const submitCourseApplication = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => applicationSchema.parse(data))
  .handler(async ({ data }): Promise<SubmitApplicationResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const application = data as CourseApplicationInput;

    try {
      // Accidental duplicate guard: same person + same course within 2 minutes.
      const since = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const { data: recent, error: recentError } = await supabaseAdmin
        .from("course_applications")
        .select("id")
        .eq("email", application.email)
        .eq("course", application.course)
        .gte("created_at", since)
        .limit(1);

      if (recentError) throw recentError;
      if (recent && recent.length > 0) {
        return { ok: true, duplicate: true };
      }

      const { data: inserted, error } = await supabaseAdmin
        .from("course_applications")
        .insert({
          full_name: application.full_name,
          email: application.email,
          phone: application.phone,
          course: application.course,
          experience_level: application.experience_level ?? null,
          learning_format: application.learning_format ?? null,
          occupation: application.occupation ?? null,
          message: application.message ?? null,
          source: application.source ?? null,
        })
        .select("created_at")
        .single();

      if (error) throw error;

      const { sendEmailSafely } = await import("./email/provider.server");
      const { adminEmail, studentEmail } = await import("./email/templates.server");

      const createdAt = new Date(inserted.created_at).toUTCString();
      const adminAddress = process.env["ADMIN_EMAIL"];

      if (adminAddress) {
        const mail = adminEmail(application, createdAt);
        await sendEmailSafely({ to: adminAddress, ...mail });
      } else {
        console.warn("[email] ADMIN_EMAIL is not configured — admin notification skipped");
      }

      const confirmation = studentEmail(application);
      await sendEmailSafely({ to: application.email, ...confirmation });

      return { ok: true };
    } catch (error) {
      console.error("[course-application] submission failed", error);
      return { ok: false, error: GENERIC_SUBMIT_ERROR };
    }
  });
