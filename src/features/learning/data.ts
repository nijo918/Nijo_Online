import "server-only";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/supabase/server";
import { uuid } from "@/lib/rules";
import { learningState } from "@/features/courses/data";
import type { Enrollment, Course } from "@/features/courses/types";
export async function getLearning(id: string) {
  const user = await requireUser("/learn/" + id);
  if (!uuid.safeParse(id).success) notFound();
  const c = await db();
  const { data: e, error } = await c
    .from("enrollments")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw new Error("Your learning space could not be loaded.");
  if (!e) notFound();
  const enrollment = e as Enrollment;
  const { data: course } = await c
    .from("courses")
    .select("*,categories(*)")
    .eq("id", enrollment.course_id)
    .single();
  if (!course) notFound();
  return {
    user,
    enrollment,
    course: course as Course,
    state: await learningState(enrollment),
  };
}
