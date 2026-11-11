import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Check,
  Clock3,
  BookOpen,
  BadgeCheck,
  ChevronRight,
} from "lucide-react";
import { getCourse, outline, enrollmentFor } from "@/features/courses/data";
import { currentUser } from "@/lib/auth";
import { CourseArt, Message, formatDuration } from "@/components/ui";
import { Submit } from "@/components/submit";
import { enrollCourse } from "@/features/learning/actions";
import { configured } from "@/lib/supabase/server";
export default async function CoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ message?: string }>;
}) {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) notFound();
  const [user, o, s] = await Promise.all([
    currentUser(),
    outline(course.id),
    searchParams,
  ]);
  const enrolled = user ? await enrollmentFor(course.id, user.id) : null;
  return (
    <div className="shell section">
      <div className="breadcrumb">
        <Link href="/courses">Explore courses</Link>
        <ChevronRight size={13} />
        <span>{course.categories?.name}</span>
        <ChevronRight size={13} />
        <span>{course.title}</span>
      </div>
      <Message text={s.message} />
      <div className="detail-grid">
        <div className="detail-copy">
          <div className="eyebrow-row">
            <span>{course.categories?.name}</span>
            <span className="type-pill">
              {course.course_type} course · Edition {course.edition}
            </span>
          </div>
          <h1>{course.title}</h1>
          <p>{course.summary}</p>
          <section className="detail-section">
            <h2>
              What you’ll <em>take with you.</em>
            </h2>
            <ul className="outcomes">
              {course.outcomes.map((v, i) => (
                <li key={i}>
                  <Check size={18} />
                  {v}
                </li>
              ))}
            </ul>
          </section>
          <section className="detail-section">
            <h2>Your path through the course.</h2>
            {o.modules.length ? (
              <div className="module-list">
                {o.modules.map((m, i) => (
                  <details key={m.id} open={i === 0}>
                    <summary>
                      {String(i + 1).padStart(2, "0")} · {m.title}
                    </summary>
                    <ul>
                      {m.lessons.map((l) => (
                        <li key={l.id}>
                          <span>
                            {l.title}
                            {!l.required ? " (optional)" : ""}
                          </span>
                          <span>{l.duration_minutes} min</span>
                        </li>
                      ))}
                      {o.assessments
                        .filter((a) => a.module_id === m.id)
                        .map((a) => (
                          <li key={a.id}>
                            <span>{a.title}</span>
                            <span>{a.pass_mark}% to pass</span>
                          </li>
                        ))}
                    </ul>
                  </details>
                ))}
                {o.assessments
                  .filter((a) => !a.module_id)
                  .map((a) => (
                    <details key={a.id}>
                      <summary>{a.title}</summary>
                      <ul>
                        <li>
                          <span>Course-wide assessment</span>
                          <span>{a.pass_mark}% to pass</span>
                        </li>
                      </ul>
                    </details>
                  ))}
              </div>
            ) : (
              <Message text="Connect the development database to explore the complete lessons and assessments." />
            )}
          </section>
        </div>
        <aside className="detail-card">
          <CourseArt slug={course.slug} large />
          <div className="detail-card-body">
            <div className="detail-price">
              Free
              <small>Every lesson. Every assessment. Your certificate.</small>
            </div>
            {!configured() ? (
              <Link href="/setup" className="btn btn-primary">
                Connect to start learning ↗
              </Link>
            ) : enrolled ? (
              <Link href={"/learn/" + enrolled.id} className="btn btn-primary">
                {enrolled.completed_at ? "Review course" : "Resume learning"} ↗
              </Link>
            ) : course.status === "published" ? (
              <form action={enrollCourse}>
                <input type="hidden" name="course_id" value={course.id} />
                <input type="hidden" name="slug" value={course.slug} />
                <Submit pending="Enrolling…">Enroll for free ↗</Submit>
              </form>
            ) : (
              <Message text="This edition is no longer accepting new enrollments." />
            )}
            <div className="detail-facts">
              <span>
                <Clock3 size={16} />
                {formatDuration(course.duration_minutes)} estimated study time
              </span>
              <span>
                <BookOpen size={16} />
                Self-paced, beginner-friendly lessons
              </span>
              <span>
                <BadgeCheck size={16} />
                Verifiable certificate of completion
              </span>
              <span>
                <Check size={16} />
                Retake assessments as you learn
              </span>
            </div>
            <p className="hint">
              Proof of course completion. This credential does not represent
              professional accreditation.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
