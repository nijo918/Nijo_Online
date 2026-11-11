import Link from "next/link";
import { getLearning } from "@/features/learning/data";
import { Progress } from "@/components/ui";
import { Outline } from "@/components/outline";
export default async function LearningLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ enrollment: string }>;
}) {
  const { enrollment: id } = await params;
  const { course, state } = await getLearning(id);
  return (
    <div className="player">
      <aside className="outline-sidebar">
        <Link href="/dashboard" className="text-link">
          ← My learning
        </Link>
        <h2>{course.title}</h2>
        <Progress value={state.percent} />
        <Outline
          enrollment={id}
          modules={state.modules}
          assessments={state.assessments}
          done={[...state.done]}
          passed={[...state.passed]}
        />
        {state.certificate && (
          <Link
            href={"/certificates/" + state.certificate.id}
            className="btn btn-outline btn-small"
            style={{ marginTop: 25 }}
          >
            View your certificate ↗
          </Link>
        )}
      </aside>
      <div className="player-content">{children}</div>
    </div>
  );
}
