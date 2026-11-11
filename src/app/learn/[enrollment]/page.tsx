import { redirect } from "next/navigation";
import { getLearning } from "@/features/learning/data";
export default async function Resume({
  params,
}: {
  params: Promise<{ enrollment: string }>;
}) {
  const { enrollment: id } = await params;
  const { enrollment, state } = await getLearning(id);
  const lesson =
    state.lessons.find((l) => l.id === enrollment.last_lesson_id) ||
    state.lessons.find((l) => !state.done.has(l.id)) ||
    state.lessons[0];
  if (lesson) redirect("/learn/" + id + "/lessons/" + lesson.id);
  return <p>This edition does not have any lessons yet.</p>;
}
