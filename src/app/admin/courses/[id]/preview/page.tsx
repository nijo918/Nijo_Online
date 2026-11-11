import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/supabase/server";
import type { Draft } from "@/features/courses/types";
import { Markdown } from "@/components/markdown";
import { uuid } from "@/lib/rules";
export default async function Preview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!uuid.safeParse(id).success) notFound();
  const { data, error } = await (
    await db()
  ).rpc("admin_get_draft", { p_id: id });
  if (error) throw new Error("Preview could not be loaded.");
  if (!data) notFound();
  const d = data as Draft;
  return (
    <>
      <div className="preview-notice">
        Admin preview · Saved {d.status} edition · This page does not create
        enrollment or progress.
      </div>
      <div className="shell section narrow">
        <Link href={"/admin/courses/" + id} className="text-link">
          ← Return to editor
        </Link>
        <div className="detail-section">
          <span className="eyebrow">
            {d.course_type} · EDITION {d.edition}
          </span>
          <h1>{d.title}</h1>
          <p>{d.summary}</p>
          <ul className="outcomes">
            {d.outcomes.map((o, i) => (
              <li key={i}>✓ {o}</li>
            ))}
          </ul>
        </div>
        {d.modules.map((m, i) => (
          <section className="detail-section" key={i}>
            <h2>
              {i + 1}. {m.title}
            </h2>
            {m.lessons.map((l, j) => (
              <article className="editor-section" key={j}>
                <h3>{l.title}</h3>
                <span className="hint">
                  {l.duration_minutes} min ·{" "}
                  {l.required ? "Required" : "Optional"}
                </span>
                <Markdown>{l.markdown}</Markdown>
                {l.video_url && (
                  <p className="hint">Optional video: {l.video_url}</p>
                )}
              </article>
            ))}
          </section>
        ))}
        {d.assessments.map((a, i) => (
          <section key={i} className="detail-section">
            <h2>{a.title}</h2>
            <p>
              {a.module_position === null
                ? "Course-wide final"
                : "Module " + (a.module_position + 1)}{" "}
              · Pass mark {a.pass_mark}% ·{" "}
              {a.required ? "Required" : "Optional"}
            </p>
            {a.questions.map((q, j) => (
              <fieldset className="quiz-question" key={j}>
                <legend>
                  {j + 1}. {q.prompt}
                </legend>
                {q.options.map((o, k) => (
                  <div className="quiz-option" key={k}>
                    ○ {o}
                  </div>
                ))}
              </fieldset>
            ))}
          </section>
        ))}
      </div>
    </>
  );
}
