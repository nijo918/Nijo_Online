import { uuid } from "@/lib/rules";
import Link from "next/link";
import { Search, ArrowLeft, ArrowRight } from "lucide-react";
import { catalog, categories } from "@/features/courses/data";
import { CourseCard, Empty } from "@/components/ui";
export const metadata = { title: "Explore courses" };
export default async function Courses({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const s = await searchParams;
  const page = Math.max(1, Math.min(1000, parseInt(s.page || "1") || 1));
  const q = (s.q || "").slice(0, 100),
    category = uuid.safeParse(s.category).success ? s.category! : "",
    type = ["Certificate", "Diploma"].includes(s.type || "") ? s.type! : "";
  const [result, cats] = await Promise.all([
    catalog(q, category, type, page),
    categories(),
  ]);
  const href = (p: number) =>
    "/courses?" + new URLSearchParams({ q, category, type, page: String(p) });
  return (
    <div className="shell section">
      <div className="page-intro">
        <span className="eyebrow">YOUR NEXT STEP STARTS HERE</span>
        <h1>
          Make room for <em>something new.</em>
        </h1>
        <p>Practical courses. Real understanding. Always free.</p>
      </div>
      <form className="catalog-filters" action="/courses">
        <label className="search-field">
          <span className="sr-only">Search courses</span>
          <Search size={19} />
          <input
            name="q"
            placeholder="What would you like to learn?"
            defaultValue={q}
          />
        </label>
        <label>
          <span className="sr-only">Category</span>
          <select name="category" defaultValue={category}>
            <option value="">All categories</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Course type</span>
          <select name="type" defaultValue={type}>
            <option value="">All course types</option>
            <option>Certificate</option>
            <option>Diploma</option>
          </select>
        </label>
        <button className="btn btn-primary">Find courses</button>
      </form>
      <div className="results-line">
        <span>
          {result.count} {result.count === 1 ? "course" : "courses"} to explore
        </span>
        <span>All levels of curiosity welcome ↗</span>
      </div>
      {result.courses.length ? (
        <div className="course-grid">
          {result.courses.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      ) : (
        <Empty title="A new direction awaits">
          <p>No courses match those filters.</p>
          <Link href="/courses" className="text-link">
            Clear filters <ArrowRight size={16} />
          </Link>
        </Empty>
      )}
      {result.count > 6 && (
        <nav className="pagination" aria-label="Course pages">
          {page > 1 && (
            <Link href={href(page - 1)} className="btn btn-outline">
              <ArrowLeft size={16} />
              Previous
            </Link>
          )}
          <span>
            Page {page} of {Math.ceil(result.count / 6)}
          </span>
          {page * 6 < result.count && (
            <Link href={href(page + 1)} className="btn btn-outline">
              Next
              <ArrowRight size={16} />
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
