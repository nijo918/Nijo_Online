import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock3, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import { getLearning } from "@/features/learning/data";
import { db } from "@/lib/supabase/server";
import { completeLesson } from "@/features/learning/actions";
import { Markdown } from "@/components/markdown";
import { LastOpened } from "@/components/last-opened";
import { Submit } from "@/components/submit";
import { Message } from "@/components/ui";
import { approvedVideo } from "@/lib/rules";
export default async function LessonPage({
  params,
  searchParams,
}: {
  params: Promise<{ enrollment: string; lesson: string }>;
  searchParams: Promise<{ message?: string }>;
}) {
  const { enrollment: id, lesson: lessonId } = await params;
  const { state } = await getLearning(id);
  const index = state.lessons.findIndex((l) => l.id === lessonId);
  if (index < 0) notFound();
  const lesson = state.lessons[index],
    courseModule = state.modules.find((m) => m.id === lesson.module_id)!;
  const { data: body, error } = await (
    await db()
  )
    .from("lesson_bodies")
    .select("markdown,video_url")
    .eq("lesson_id", lessonId)
    .maybeSingle();
  if (error) throw new Error("Lesson content could not be loaded.");
  if (!body) notFound();
  const s = await searchParams;
  const previous = state.lessons[index - 1],
    next = state.lessons[index + 1];
  const quiz =
    state.assessments.find(
      (a) => a.module_id === courseModule.id && !state.passed.has(a.id),
    ) || state.assessments.find((a) => !a.module_id && !state.passed.has(a.id));
  const nextPath = next
    ? "/learn/" + id + "/lessons/" + next.id
    : quiz
      ? "/learn/" + id + "/quizzes/" + quiz.id
      : "/dashboard";
  const video = approvedVideo(body.video_url);
  return (
    <>
      <LastOpened enrollment={id} lesson={lessonId} />
      <span className="eyebrow">
        {courseModule.title} · LESSON {index + 1} OF {state.lessons.length}
      </span>
      <h1>{lesson.title}</h1>
      <div className="lesson-meta">
        <span>
          <Clock3
            size={13}
            style={{ display: "inline", verticalAlign: "middle" }}
          />{" "}
          {lesson.duration_minutes} min read
        </span>
        <span>{lesson.required ? "Required lesson" : "Optional lesson"}</span>
        {state.done.has(lessonId) && (
          <span>
            <CheckCircle2
              size={13}
              style={{ display: "inline", verticalAlign: "middle" }}
            />{" "}
            Completed
          </span>
        )}
      </div>
      <Message text={s.message} />
      {video && (
        <>
          <iframe
            className="video-frame"
            src={video}
            title={lesson.title + " optional video"}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox="allow-scripts allow-same-origin allow-presentation"
            allowFullScreen
          />
          <p className="hint">
            Video unavailable? Everything you need is in the lesson text below.
          </p>
        </>
      )}
      <Markdown>{body.markdown}</Markdown>
      <div className="lesson-controls">
        {previous ? (
          <Link
            href={"/learn/" + id + "/lessons/" + previous.id}
            className="text-link"
          >
            <ArrowLeft size={15} />
            Previous lesson
          </Link>
        ) : (
          <span />
        )}
        <form action={completeLesson}>
          <input type="hidden" name="enrollment_id" value={id} />
          <input type="hidden" name="lesson_id" value={lessonId} />
          <input type="hidden" name="next" value={nextPath} />
          <Submit pending="Saving progress…">
            {state.done.has(lessonId) ? "Continue" : "Mark complete & continue"}{" "}
            <ArrowRight size={16} />
          </Submit>
        </form>
      </div>
      {quiz && (
        <p className="hint">
          <Link
            href={"/learn/" + id + "/quizzes/" + quiz.id}
            className="text-link"
          >
            Go to {quiz.title} →
          </Link>
        </p>
      )}
    </>
  );
}
