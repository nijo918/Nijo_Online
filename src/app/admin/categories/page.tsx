import Link from "next/link";
import { categories } from "@/features/courses/data";
import { saveCategory } from "@/features/admin/actions";
import { Submit } from "@/components/submit";
import { Message } from "@/components/ui";
export default async function Categories({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const [cats, s] = await Promise.all([categories(), searchParams]);
  return (
    <div className="shell section narrow">
      <Link href="/admin" className="text-link">
        ← Admin overview
      </Link>
      <div className="content-heading">
        <h1>Course categories.</h1>
      </div>
      <Message text={s.message} />
      <div className="category-list">
        {cats.map((c) => (
          <form key={c.id} action={saveCategory}>
            <input type="hidden" name="id" value={c.id} />
            <input
              name="name"
              aria-label={"Name for " + c.name}
              defaultValue={c.name}
              minLength={2}
              maxLength={80}
              required
            />
            <input
              name="slug"
              aria-label={"Slug for " + c.name}
              defaultValue={c.slug}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              required
            />
            <Submit className="btn btn-outline btn-small">Save</Submit>
          </form>
        ))}
      </div>
      <section className="editor-section">
        <h2>Add a category</h2>
        <form className="stack-form" action={saveCategory}>
          <label>
            Name
            <input name="name" minLength={2} maxLength={80} required />
          </label>
          <label>
            Slug
            <input name="slug" pattern="[a-z0-9]+(-[a-z0-9]+)*" required />
            <small>For example: personal-development</small>
          </label>
          <Submit>Add category</Submit>
        </form>
      </section>
    </div>
  );
}
