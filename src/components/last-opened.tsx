"use client";
import { useEffect, useState, startTransition } from "react";
import { openLesson } from "@/features/learning/actions";
export function LastOpened({
  enrollment,
  lesson,
}: {
  enrollment: string;
  lesson: string;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    startTransition(() => {
      void openLesson(enrollment, lesson)
        .then((result) => {
          if (active && result && !result.ok) setFailed(true);
        })
        .catch(() => {
          if (active) setFailed(true);
        });
    });
    return () => {
      active = false;
    };
  }, [enrollment, lesson]);
  return failed ? (
    <p className="message error" role="status">
      Your resume position could not be saved. Marking the lesson complete will
      try again.
    </p>
  ) : null;
}
