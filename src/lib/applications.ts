import { z } from "zod";

export const EXPERIENCE_LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;
export const LEARNING_FORMATS = ["Live Online", "Physical", "Either"] as const;
export const SOURCES = [
  "Google",
  "Facebook",
  "Instagram",
  "LinkedIn",
  "WhatsApp",
  "Friend/Referral",
  "Other",
] as const;

export const applicationSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Please enter your full name.")
    .max(100, "Name is too long."),
  email: z
    .string()
    .trim()
    .min(1, "Please enter your email address.")
    .email("Please enter a valid email address.")
    .max(255),
  phone: z
    .string()
    .trim()
    .min(7, "Please enter a valid phone number.")
    .max(20, "Phone number is too long.")
    .regex(/^[0-9+()\-\s]+$/, "Phone can only contain digits and + ( ) -"),
  course: z.string().trim().min(1, "Please choose a course.").max(200),
  experience_level: z.string().trim().max(50).optional(),
  learning_format: z.string().trim().max(50).optional(),
  occupation: z.string().trim().max(120).optional(),
  message: z.string().trim().max(1000, "Message is too long.").optional(),
  source: z.string().trim().max(50).optional(),
});

export type CourseApplicationInput = z.infer<typeof applicationSchema>;

export type SubmitApplicationResult =
  | { ok: true; duplicate?: boolean }
  | { ok: false; error: string };

export const GENERIC_SUBMIT_ERROR =
  "We could not submit your application at this time. Please try again or contact us directly.";
