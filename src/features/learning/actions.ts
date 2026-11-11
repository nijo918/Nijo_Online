"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { uuid, safeNext } from "@/lib/rules";
export async function enrollCourse(form: FormData) {
  const slug = String(form.get("slug") || "");
  const next = "/courses/" + encodeURIComponent(slug);
  await requireUser(next);
  const course = uuid.parse(form.get("course_id"));
  const c = await db();
  const { data: id, error } = await c.rpc("enroll", { p_course: course });
  if (error)
    redirect(
      next + "?message=This+course+could+not+be+enrolled.+Please+try+again.",
    );
  revalidatePath("/dashboard");
  redirect("/learn/" + id);
}
export async function openLesson(enrollmentId: string, lessonId: string) {
  await requireUser("/learn/" + enrollmentId);
  if (
    !uuid.safeParse(enrollmentId).success ||
    !uuid.safeParse(lessonId).success
  )
    return;
  const { error } = await (
    await db()
  ).rpc("touch_lesson", {
    p_enrollment: enrollmentId,
    p_lesson: lessonId,
    p_complete: false,
  });
  return { ok: !error };
}
export async function completeLesson(form: FormData) {
  const enrollment = uuid.parse(form.get("enrollment_id"));
  const lesson = uuid.parse(form.get("lesson_id"));
  const next = safeNext(form.get("next"), "/learn/" + enrollment);
  await requireUser(next);
  const { error } = await (
    await db()
  ).rpc("touch_lesson", {
    p_enrollment: enrollment,
    p_lesson: lesson,
    p_complete: true,
  });
  if (error)
    redirect(
      "/learn/" +
        enrollment +
        "/lessons/" +
        lesson +
        "?message=Your+progress+could+not+be+saved.+Please+try+again.",
    );
  revalidatePath("/dashboard");
  revalidatePath("/learn/" + enrollment, "layout");
  redirect(next);
}
export async function submitQuiz(form: FormData) {
  const enrollment = uuid.parse(form.get("enrollment_id"));
  const assessment = uuid.parse(form.get("assessment_id"));
  const request = uuid.parse(form.get("request_id"));
  const path = "/learn/" + enrollment + "/quizzes/" + assessment;
  await requireUser(path);
  const answers: Record<string, string> = {};
  for (const [k, v] of form.entries())
    if (k.startsWith("question_")) {
      const q = uuid.safeParse(k.slice(9)),
        o = uuid.safeParse(v);
      if (!q.success || !o.success)
        redirect(path + "?message=Choose+one+valid+option+for+every+question.");
      answers[q.data] = o.data;
    }
  const { data, error } = await (
    await db()
  ).rpc("submit_quiz", {
    p_enrollment: enrollment,
    p_assessment: assessment,
    p_answers: answers,
    p_request: request,
  });
  if (error)
    redirect(
      path +
        "?message=Unable+to+submit.+Complete+the+required+lessons+and+answer+every+question.",
    );
  revalidatePath("/dashboard");
  revalidatePath("/learn/" + enrollment, "layout");
  redirect(path + "?result=" + data.id);
}
