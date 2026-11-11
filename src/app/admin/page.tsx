import Link from "next/link";
import { db } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import type { Course, Enrollment } from "@/features/courses/types";
export const metadata = { title: "Admin overview" };
export default async function Admin() {
  await requireAdmin();
  const c = await db();
  const [courses, enrollments] = await Promise.all([
    c.from("courses").select("*").order("updated_at", { ascending: false }),
    c.from("enrollments").select("id,course_id,completed_at"),
  ]);
  if (courses.error || enrollments.error)
    throw new Error("Admin overview could not be loaded.");
  const rows = courses.data as Course[],
    all = enrollments.data as Enrollment[];
  return (
    <div className="shell section">
      <div className="dashboard-header">
        <div>
          <span className="eyebrow">NIJO LEARN · ADMINISTRATION</span>
          <h1>
            Make learning <em>possible.</em>
          </h1>
          <p>Create thoughtful courses. Follow the progress they inspire.</p>
        </div>
        <div className="actions-row">
          <Link href="/admin/categories" className="btn btn-outline btn-small">
            Categories
          </Link>
          <Link href="/admin/courses/new" className="btn btn-primary btn-small">
            Create a course +
          </Link>
        </div>
      </div>
      <div className="stats-grid">
        {[
          [rows.filter((c) => c.status === "draft").length, "Draft courses"],
          [
            rows.filter((c) => c.status === "published").length,
            "Published courses",
          ],
          [all.length, "Enrollments"],
          [all.filter((e) => e.completed_at).length, "Completions"],
        ].map(([n, l]) => (
          <div className="stat" key={l}>
            <strong>{n}</strong>
            <span>{l}</span>
          </div>
        ))}
      </div>
      <div className="content-heading">
        <h2>Your course library.</h2>
        <span className="hint">Published editions are immutable.</span>
      </div>
      <div className="table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Status</th>
              <th>Edition</th>
              <th>Enrolled</th>
              <th>Completed</th>
              <th>Manage</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td>
                  {c.title}
                  <small
                    style={{
                      display: "block",
                      fontWeight: 400,
                      color: "var(--muted)",
                    }}
                  >
                    {c.course_type}
                  </small>
                </td>
                <td>
                  <span className={"status " + c.status}>{c.status}</span>
                </td>
                <td>{c.edition}</td>
                <td>{all.filter((e) => e.course_id === c.id).length}</td>
                <td>
                  {
                    all.filter((e) => e.course_id === c.id && e.completed_at)
                      .length
                  }
                </td>
                <td>
                  <Link href={"/admin/courses/" + c.id} className="text-link">
                    Open →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
