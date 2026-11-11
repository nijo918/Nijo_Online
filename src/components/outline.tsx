"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Circle, ClipboardCheck } from "lucide-react";
import type { Module, Assessment } from "@/features/courses/types";
export function Outline({
  enrollment,
  modules,
  assessments,
  done,
  passed,
}: {
  enrollment: string;
  modules: Module[];
  assessments: Assessment[];
  done: string[];
  passed: string[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const quiz = (a: Assessment) => {
    const href = "/learn/" + enrollment + "/quizzes/" + a.id;
    return (
      <Link
        className={
          "outline-link " +
          (pathname === href ? "active " : "") +
          (passed.includes(a.id) ? "done" : "")
        }
        key={a.id}
        href={href}
      >
        {passed.includes(a.id) ? <CheckCircle2 /> : <ClipboardCheck />}
        <span>
          {a.title}
          {!a.required ? " (optional)" : ""}
        </span>
      </Link>
    );
  };
  return (
    <details
      className="outline-toggle"
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary>Course outline · toggle</summary>
      {modules.map((m, i) => (
        <div className="outline-module" key={m.id}>
          <h3>
            {String(i + 1).padStart(2, "0")} · {m.title}
          </h3>
          {m.lessons.map((l) => {
            const href = "/learn/" + enrollment + "/lessons/" + l.id;
            return (
              <Link
                key={l.id}
                href={href}
                className={
                  "outline-link " +
                  (pathname === href ? "active " : "") +
                  (done.includes(l.id) ? "done" : "")
                }
              >
                {done.includes(l.id) ? <CheckCircle2 /> : <Circle />}
                <span>
                  {l.title}
                  {!l.required ? " (optional)" : ""}
                </span>
              </Link>
            );
          })}
          {assessments.filter((a) => a.module_id === m.id).map(quiz)}
        </div>
      ))}
      <div className="outline-module">
        {assessments.filter((a) => !a.module_id).map(quiz)}
      </div>
    </details>
  );
}
