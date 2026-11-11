import fs from "node:fs/promises";
import { demoCourses, demoCategories } from "../src/features/courses/demo";
type Original = {
  slug: string;
  modules: { title: string; lessons: { title: string; markdown: string }[] }[];
  assessments: object[];
};
async function main() {
  const content: Original[] = JSON.parse(
    await fs.readFile("database/original-content.json", "utf8"),
  );
  let sql =
    "-- Original Nijo Learn demonstration content. Safe to repeat; existing slugs are preserved.\n";
  for (const c of demoCategories)
    sql +=
      "insert into public.categories(id,name,slug) values ('" +
      c.id +
      "','" +
      c.name +
      "','" +
      c.slug +
      "') on conflict do nothing;\n";
  for (const c of demoCourses) {
    const original = content.find((o) => o.slug === c.slug)!;
    const payload = {
      ...c,
      modules: original.modules.map((m) => ({
        ...m,
        lessons: m.lessons.map((l) => ({
          ...l,
          required: true,
          duration_minutes: Math.round(c.duration_minutes / 4),
          video_url: null,
        })),
      })),
      assessments: original.assessments.map((a) => ({
        ...a,
        required: true,
        pass_mark: 70,
      })),
    };
    sql +=
      "do $seed$ declare cid uuid; begin if not exists(select 1 from public.courses where slug='" +
      c.slug +
      "') then cid:=private.store_draft($json$" +
      JSON.stringify(payload) +
      "$json$::jsonb); perform private.validate_publish(cid); update public.courses set status='published' where id=cid; end if; end $seed$;\n";
  }
  await fs.mkdir("supabase", { recursive: true });
  await fs.writeFile("supabase/seed.sql", sql);
  console.log("Generated three original courses.");
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
