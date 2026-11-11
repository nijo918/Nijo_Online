import Link from "next/link";
import {
  ArrowUpRight,
  Clock3,
  Layers3,
  Network,
  ShieldCheck,
  Table2,
  Check,
  BookOpen,
} from "lucide-react";
import type { Course } from "@/features/courses/types";
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Nijo Learn home">
      <span className="brand-mark">
        <span />
        <span />
        <span />
      </span>
      <span>
        nijo<span className="brand-light">learn</span>
        <small>SMALL STEPS. REAL POSSIBILITIES.</small>
      </span>
    </Link>
  );
}
export function CourseArt({
  slug,
  large = false,
}: {
  slug: string;
  large?: boolean;
}) {
  const isNet = slug.includes("network"),
    isSecurity = slug.includes("cyber");
  const Icon = isNet ? Network : isSecurity ? ShieldCheck : Table2;
  return (
    <div
      className={
        "course-art " +
        (isNet ? "art-network" : isSecurity ? "art-security" : "art-excel") +
        (large ? " art-large" : "")
      }
      aria-hidden="true"
    >
      <div className="art-grid" />
      <div className="art-orbit orbit-one" />
      <div className="art-orbit orbit-two" />
      <div className="art-icon">
        <Icon strokeWidth={1.3} />
      </div>
      <span className="art-label">
        {isNet
          ? "CONNECTED THINKING"
          : isSecurity
            ? "BUILD YOUR DEFENSE"
            : "MAKE DATA MAKE SENSE"}
      </span>
      <span className="art-number">
        {isNet ? "01" : isSecurity ? "02" : "03"}
      </span>
    </div>
  );
}
export function CourseCard({ course }: { course: Course }) {
  return (
    <article className="course-card">
      <Link href={"/courses/" + course.slug} tabIndex={-1} aria-hidden="true">
        <CourseArt slug={course.slug} />
      </Link>
      <div className="course-card-body">
        <div className="eyebrow-row">
          <span>{course.categories?.name || "Learning"}</span>
          <span className="type-pill">{course.course_type}</span>
        </div>
        <h3>
          <Link href={"/courses/" + course.slug}>{course.title}</Link>
        </h3>
        <p>{course.summary}</p>
        <div className="course-meta">
          <span>
            <Clock3 size={14} />
            {formatDuration(course.duration_minutes)}
          </span>
          <span>
            <Layers3 size={14} />
            Beginner friendly
          </span>
        </div>
        <div className="card-bottom">
          <span>
            Free <small>to learn & certify</small>
          </span>
          <Link
            href={"/courses/" + course.slug}
            aria-label={"Explore " + course.title}
          >
            <ArrowUpRight size={21} />
          </Link>
        </div>
      </div>
    </article>
  );
}
export function formatDuration(n: number) {
  return n >= 60
    ? (n / 60).toLocaleString("en", { maximumFractionDigits: 1 }) + " hours"
    : n + " min";
}
export function Progress({
  value,
  label = "Course progress",
}: {
  value: number;
  label?: string;
}) {
  return (
    <div className="progress-wrap">
      <div className="progress-label">
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>
      <div
        className="progress"
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span style={{ width: value + "%" }} />
      </div>
    </div>
  );
}
export function Message({
  text,
  kind = "info",
}: {
  text?: string;
  kind?: "info" | "error" | "success";
}) {
  return text ? (
    <div
      role={kind === "error" ? "alert" : "status"}
      className={"message " + kind}
    >
      {text}
    </div>
  ) : null;
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="empty">
      <BookOpen size={32} />
      <h2>{title}</h2>
      <div>{children}</div>
    </div>
  );
}
export function Tick({ children }: { children: React.ReactNode }) {
  return (
    <span className="tick">
      <Check size={17} />
      {children}
    </span>
  );
}
