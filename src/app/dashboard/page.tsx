import Link from "next/link";
import { ArrowUpRight, Download } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/supabase/server";
import { learningState } from "@/features/courses/data";
import { CourseArt, Progress, Empty, Message } from "@/components/ui";
import type { Enrollment, Course } from "@/features/courses/types";
export const metadata = { title: "My learning" };
export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const user = await requireUser();
  const { data, error } = await (
    await db()
  )
    .from("enrollments")
    .select("*,courses(*,categories(*))")
    .eq("user_id", user.id)
    .order("enrolled_at", { ascending: false });
  if (error) throw new Error("Your courses could not be loaded.");
  const courses = await Promise.all(
    data.map(async (row) => ({
      enrollment: row as Enrollment,
      course: row.courses as Course,
      state: await learningState(row as Enrollment),
    })),
  );
  const completed = courses.filter((c) => c.enrollment.completed_at).length;
  const s = await searchParams;
  return (
    <div className="shell section">
      <div className="dashboard-header">
        <div>
          <span className="eyebrow">ONE STEP FURTHER, EVERY DAY</span>
          <h1>
            Hello, <em>{user.display_name}.</em>
          </h1>
          <p>A little progress today. More possibilities tomorrow.</p>
        </div>
        <div className="account-links">
          <Link href="/settings">Profile settings</Link>
          <Link href="/courses" className="text-link">
            Explore courses <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
      <Message text={s.message} />
      <div className="stats-grid">
        <div className="stat">
          <strong>{courses.length}</strong>
          <span>Courses enrolled</span>
        </div>
        <div className="stat">
          <strong>{courses.length - completed}</strong>
          <span>In progress</span>
        </div>
        <div className="stat">
          <strong>{completed}</strong>
          <span>Courses completed</span>
        </div>
        <div className="stat">
          <strong>{courses.filter((c) => c.state.certificate).length}</strong>
          <span>Certificates earned</span>
        </div>
      </div>
      <div className="content-heading">
        <h2>Your learning journey.</h2>
        <span className="hint">Every step counts.</span>
      </div>
      {!courses.length ? (
        <Empty title="Your first chapter is waiting">
          <p>Choose a free course and make a start.</p>
          <Link href="/courses" className="btn btn-primary">
            Find a course <ArrowUpRight size={17} />
          </Link>
        </Empty>
      ) : (
        <div className="dashboard-courses">
          {courses.map(({ enrollment: e, course: c, state: s }) => (
            <article className="learning-card" key={e.id}>
              <CourseArt slug={c.slug} />
              <div className="learning-card-content">
                <span className="eyebrow">
                  {e.completed_at
                    ? "COMPLETED · WELL DONE"
                    : c.course_type + " COURSE"}
                  {c.status === "archived" ? " · ARCHIVED EDITION" : ""}
                </span>
                <h3>{c.title}</h3>
                <Progress value={s.percent} />
                <div className="learning-card-footer">
                  <Link
                    href={"/learn/" + e.id}
                    className="btn btn-primary btn-small"
                  >
                    {e.completed_at ? "Review course" : "Continue learning"}{" "}
                    <ArrowUpRight size={15} />
                  </Link>
                  {s.certificate && (
                    <Link
                      href={"/certificates/" + s.certificate.id}
                      className="text-link"
                    >
                      <Download size={15} />
                      View certificate
                    </Link>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
