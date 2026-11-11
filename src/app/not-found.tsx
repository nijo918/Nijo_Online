import Link from "next/link";
export default function NotFound() {
  return (
    <div className="shell section empty">
      <span className="eyebrow">404 · A DIFFERENT PATH</span>
      <h1>This page is out of reach.</h1>
      <p>Find your way back to a new skill.</p>
      <Link href="/courses" className="btn btn-primary">
        Explore courses
      </Link>
    </div>
  );
}
