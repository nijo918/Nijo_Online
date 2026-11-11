import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/supabase/server";
import { categories } from "@/features/courses/data";
import { DraftEditor } from "@/features/admin/editor";
import { lifecycle } from "@/features/admin/actions";
import type { Draft } from "@/features/courses/types";
import { Message } from "@/components/ui";
import { Submit } from "@/components/submit";
import { uuid } from "@/lib/rules";
export default async function EditCourse({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string }>;
}) {
  const { id } = await params;
  const cats = await categories();
  const s = await searchParams;
  let draft: Draft;
  if (id === "new")
    draft = {
      category_id: cats[0]?.id || "",
      title: "Untitled course",
      slug: "new-course",
      summary: "",
      outcomes: [],
      course_type: "Certificate",
      duration_minutes: 60,
      status: "draft",
      edition: 1,
      modules: [],
      assessments: [],
    };
  else {
    if (!uuid.safeParse(id).success) notFound();
    const { data, error } = await (
      await db()
    ).rpc("admin_get_draft", { p_id: id });
    if (error) throw new Error("Course editor could not be loaded.");
    if (!data) notFound();
    draft = data as Draft;
  }
  return (
    <div className="shell section">
      <div className="editor-layout">
        <Link href="/admin" className="text-link">
          ← Admin overview
        </Link>
        <div className="editor-heading" style={{ marginTop: 25 }}>
          <div>
            <span className="eyebrow">
              EDITION {draft.edition} · {draft.status.toUpperCase()}
            </span>
            <h1>{id === "new" ? "A new possibility." : draft.title}</h1>
            <p className="hint">
              Draft → Published → Archived. Duplicate a published edition to
              revise it.
            </p>
          </div>
          <div className="editor-actions">
            {draft.id && (
              <>
                <Link
                  href={"/admin/courses/" + draft.id + "/preview"}
                  className="btn btn-outline btn-small"
                >
                  Preview saved version
                </Link>
                <form action={lifecycle}>
                  <input type="hidden" name="course_id" value={draft.id} />
                  <input
                    type="hidden"
                    name="action"
                    value={draft.status === "draft" ? "publish" : "duplicate"}
                  />
                  <Submit className="btn btn-primary btn-small">
                    {draft.status === "draft"
                      ? "Publish saved draft"
                      : "Duplicate as new draft"}
                  </Submit>
                </form>
                {draft.status === "published" && (
                  <form action={lifecycle}>
                    <input type="hidden" name="course_id" value={draft.id} />
                    <input type="hidden" name="action" value="archive" />
                    <Submit className="btn btn-outline btn-small">
                      Archive edition
                    </Submit>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
        <Message text={s.message} />
        {!cats.length && (
          <Message text="Create a category before saving a course." />
        )}
        {draft.status === "draft" ? (
          <DraftEditor initial={draft} categories={cats} />
        ) : (
          <div className="editor-section">
            <h2>This edition is preserved.</h2>
            <p>
              Enrolled learners keep this exact content, progress and
              credentials. Create a new draft edition to make changes.
            </p>
            <Link
              href={"/admin/courses/" + draft.id + "/preview"}
              className="text-link"
            >
              Review this edition →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
