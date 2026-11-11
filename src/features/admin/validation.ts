import { z } from "zod";
import { approvedVideo } from "@/lib/rules";
const lesson = z.object({
  title: z.string().trim().min(2).max(140),
  markdown: z.string().max(50000),
  video_url: z
    .string()
    .nullable()
    .refine(
      (v) => !v || approvedVideo(v) !== null,
      "Use a youtube-nocookie.com/embed URL",
    ),
  required: z.boolean(),
  duration_minutes: z.number().int().min(1).max(6000),
});
const question = z
  .object({
    prompt: z.string().trim().min(3).max(1000),
    options: z.array(z.string().trim().min(1).max(500)).max(12),
    correct_index: z.number().int().min(0).nullable(),
  })
  .refine(
    (q) => q.correct_index === null || q.correct_index < q.options.length,
    "Select an existing correct option",
  );
export const draftSchema = z
  .object({
    title: z.string().trim().min(3).max(140),
    slug: z
      .string()
      .max(180)
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
    category_id: z.uuid(),
    summary: z.string().max(2000),
    outcomes: z
      .array(z.string().trim())
      .max(30)
      .transform((values) => values.filter(Boolean))
      .pipe(z.array(z.string().min(3).max(300))),
    course_type: z.enum(["Certificate", "Diploma"]),
    duration_minutes: z.number().int().min(5).max(60000),
    modules: z
      .array(
        z.object({
          title: z.string().trim().min(2).max(140),
          lessons: z.array(lesson).max(100),
        }),
      )
      .max(50),
    assessments: z
      .array(
        z.object({
          title: z.string().trim().min(2).max(140),
          module_position: z.number().int().min(0).nullable(),
          required: z.boolean(),
          pass_mark: z.number().int().min(1).max(100),
          questions: z.array(question).max(100),
        }),
      )
      .max(50),
  })
  .refine(
    (d) =>
      d.assessments.every(
        (a) =>
          a.module_position === null || a.module_position < d.modules.length,
      ),
    "Assessment module must exist",
  );
