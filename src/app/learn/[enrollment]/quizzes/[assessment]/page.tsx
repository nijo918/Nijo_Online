import Link from "next/link";
import { notFound } from "next/navigation";
import { randomUUID } from "node:crypto";
import { getLearning } from "@/features/learning/data";
import { db } from "@/lib/supabase/server";
import { submitQuiz } from "@/features/learning/actions";
import { Submit } from "@/components/submit";
import { Message } from "@/components/ui";
import { formatDate } from "@/lib/rules";
export default async function QuizPage({
  params,
  searchParams,
}: {
  params: Promise<{ enrollment: string; assessment: string }>;
  searchParams: Promise<{ message?: string; result?: string }>;
}) {
  const { enrollment: id, assessment: aid } = await params;
  const { state } = await getLearning(id);
  const assessment = state.assessments.find((a) => a.id === aid);
  if (!assessment) notFound();
  const c = await db();
  const { data: unlocked, error: unlockError } = await c.rpc("quiz_unlocked", {
    p_enrollment: id,
    p_assessment: aid,
  });
  if (unlockError)
    throw new Error("Assessment availability could not be checked.");
  const attempts = state.attempts.filter((a) => a.assessment_id === aid),
    latest = attempts[0],
    best = attempts.length
      ? Math.max(...attempts.map((a) => Number(a.score)))
      : null;
  const s = await searchParams;
  const result = s.result ? attempts.find((a) => a.id === s.result) : null;
  const { data: questions, error } = unlocked
    ? await c
        .from("questions")
        .select("id,prompt,position,options(id,label,position)")
        .eq("assessment_id", aid)
        .order("position")
    : { data: null, error: null };
  if (error) throw new Error("Questions could not be loaded.");
  return (
    <>
      <span className="eyebrow">CHECK YOUR UNDERSTANDING</span>
      <h1>{assessment.title}</h1>
      <p>
        Choose one answer per question. You need {assessment.pass_mark}% to
        pass. Take your time, and retake the assessment whenever you’re ready.
      </p>
      <Message text={s.message} kind="error" />
      {result && (
        <div className="quiz-results" role="status">
          <span className="eyebrow">
            {result.passed
              ? "A STEP WORTH CELEBRATING"
              : "KEEP GOING — YOU’RE LEARNING"}
          </span>
          <span className="score-big">{Number(result.score).toFixed(1)}%</span>
          <h2>
            {result.passed ? "Assessment passed." : "Not quite there yet."}
          </h2>
          <p>
            {result.passed
              ? "Your passing result is saved. Carry on with your learning journey."
              : "Review the lessons and have another go. Your best score is always kept."}
          </p>
          <p className="hint">
            Pass decisions use your exact score before rounding.
          </p>
          {state.certificate && (
            <Link
              href={"/certificates/" + state.certificate.id}
              className="btn btn-primary"
            >
              Your certificate is ready ↗
            </Link>
          )}
        </div>
      )}
      {latest && (
        <div className="score-row">
          <span>
            Latest:{" "}
            <strong>
              {Number(latest.score).toFixed(1)}% ·{" "}
              {latest.passed ? "Passed" : "Not passed"}
            </strong>
          </span>
          <span>
            Best: <strong>{best!.toFixed(1)}%</strong>
          </span>
          <span>
            {attempts.length} {attempts.length === 1 ? "attempt" : "attempts"}
          </span>
        </div>
      )}
      {!unlocked ? (
        <Message text="Complete all required lessons in this module before taking its quiz. A final assessment requires all required lessons in the course." />
      ) : (
        <form action={submitQuiz}>
          <input type="hidden" name="enrollment_id" value={id} />
          <input type="hidden" name="assessment_id" value={aid} />
          <input type="hidden" name="request_id" value={randomUUID()} />
          {questions?.map((q, i) => (
            <fieldset key={q.id} className="quiz-question">
              <legend>
                {i + 1}. {q.prompt}
              </legend>
              {q.options
                .sort((a, b) => a.position - b.position)
                .map((o) => (
                  <label className="quiz-option" key={o.id}>
                    <input
                      type="radio"
                      name={"question_" + q.id}
                      value={o.id}
                      required
                    />
                    <span>{o.label}</span>
                  </label>
                ))}
            </fieldset>
          ))}
          <Submit pending="Checking your answers…">
            {attempts.length ? "Submit another attempt" : "Submit assessment"} →
          </Submit>
        </form>
      )}
      {attempts.length > 0 && (
        <section className="detail-section">
          <h2>Your attempts</h2>
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Score</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => (
                  <tr key={a.id}>
                    <td>{formatDate(a.submitted_at)}</td>
                    <td>{Number(a.score).toFixed(1)}%</td>
                    <td>{a.passed ? "Passed" : "Not passed"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
