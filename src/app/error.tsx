"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="shell section empty">
      <h1>Let’s try that again.</h1>
      <p>
        We couldn’t load this page. Check your connection and your development
        database, then retry.
      </p>
      <button onClick={reset} className="btn btn-primary">
        Try again
      </button>
    </div>
  );
}
