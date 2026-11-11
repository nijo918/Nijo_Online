import "server-only";
import { db, configured } from "@/lib/supabase/server";
import { demoCourses, demoCategories } from "./demo";
import type {
  Course,
  Category,
  Module,
  Assessment,
  Enrollment,
  Attempt,
  Certificate,
} from "./types";
export async function categories(): Promise<Category[]> {
  if (!configured()) return demoCategories;
  const { data, error } = await (
    await db()
  )
    .from("categories")
    .select("*")
    .order("name");
  if (error) throw new Error("Categories are temporarily unavailable.");
  return data;
}
export async function catalog(query = "", category = "", type = "", page = 1) {
  const size = 6;
  if (!configured()) {
    const all = demoCourses.filter(
      (c) =>
        (!query ||
          (c.title + " " + c.summary)
            .toLowerCase()
            .includes(query.toLowerCase())) &&
        (!category || c.category_id === category) &&
        (!type || c.course_type === type),
    );
    return {
      courses: all.slice((page - 1) * size, page * size),
      count: all.length,
    };
  }
  let q = (await db())
    .from("courses")
    .select("*,categories(*)", { count: "exact" })
    .eq("status", "published")
    .order("created_at");
  if (query) q = q.ilike("title", "%" + query.replace(/[%_,()]/g, "") + "%");
  if (category) q = q.eq("category_id", category);
  if (type) q = q.eq("course_type", type);
  const { data, error, count } = await q.range(
    (page - 1) * size,
    page * size - 1,
  );
  if (error)
    throw new Error("Courses are temporarily unavailable. Please try again.");
  return { courses: data as Course[], count: count || 0 };
}
export async function getCourse(slug: string): Promise<Course | null> {
  if (!configured()) return demoCourses.find((c) => c.slug === slug) || null;
  const { data, error } = await (
    await db()
  )
    .from("courses")
    .select("*,categories(*)")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error("Course could not be loaded.");
  return data;
}
export async function outline(courseId: string) {
  if (!configured())
    return { modules: [] as Module[], assessments: [] as Assessment[] };
  const c = await db();
  const [m, a] = await Promise.all([
    c
      .from("modules")
      .select("*,lessons(*)")
      .eq("course_id", courseId)
      .order("position"),
    c
      .from("assessments")
      .select("*")
      .eq("course_id", courseId)
      .order("position"),
  ]);
  if (m.error || a.error)
    throw new Error("Course outline could not be loaded.");
  return {
    modules: (m.data as Module[]).map((m) => ({
      ...m,
      lessons: m.lessons.sort((a, b) => a.position - b.position),
    })),
    assessments: a.data as Assessment[],
  };
}
export async function enrollmentFor(
  courseId: string,
  userId: string,
): Promise<Enrollment | null> {
  const { data, error } = await (
    await db()
  )
    .from("enrollments")
    .select("*")
    .eq("course_id", courseId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error("Enrollment could not be loaded.");
  return data;
}
export async function learningState(enrollment: Enrollment) {
  const c = await db();
  const [o, p, a, cert] = await Promise.all([
    outline(enrollment.course_id),
    c
      .from("lesson_progress")
      .select("lesson_id")
      .eq("enrollment_id", enrollment.id),
    c
      .from("attempts")
      .select("*")
      .eq("enrollment_id", enrollment.id)
      .order("submitted_at", { ascending: false }),
    c
      .from("certificates")
      .select("*")
      .eq("enrollment_id", enrollment.id)
      .maybeSingle(),
  ]);
  if (p.error || a.error || cert.error)
    throw new Error("Learning progress could not be loaded.");
  const done = new Set(p.data.map((p) => p.lesson_id));
  const passed = new Set(
    (a.data as Attempt[]).filter((a) => a.passed).map((a) => a.assessment_id),
  );
  const lessons = o.modules.flatMap((m) => m.lessons);
  const total =
    lessons.filter((l) => l.required).length +
    o.assessments.filter((a) => a.required).length;
  const completed =
    lessons.filter((l) => l.required && done.has(l.id)).length +
    o.assessments.filter((a) => a.required && passed.has(a.id)).length;
  return {
    ...o,
    lessons,
    done,
    passed,
    attempts: a.data as Attempt[],
    certificate: cert.data as Certificate | null,
    total,
    completed,
    percent: total ? Math.floor((completed * 100) / total) : 0,
  };
}
