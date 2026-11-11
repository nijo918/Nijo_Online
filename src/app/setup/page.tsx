import Link from "next/link";
export default function Setup() {
  return (
    <div className="shell section narrow">
      <span className="eyebrow">LOCAL DEVELOPMENT</span>
      <h1>Connect your learning space.</h1>
      <p>
        The catalog preview is ready. Accounts, enrollment and learning records
        need your Supabase development database.
      </p>
      <ol className="setup-steps">
        <li>Install Docker Desktop and start its engine.</li>
        <li>
          In this project, run <code>npm install</code>, then{" "}
          <code>npx supabase start</code>.
        </li>
        <li>
          Run <code>npx supabase db reset</code> to apply migrations and seed
          the three courses.
        </li>
        <li>
          Copy <code>.env.example</code> to <code>.env.local</code>. Add your
          local publishable key from <code>npx supabase status</code>.
        </li>
        <li>
          Restart <code>npm run dev</code>. Follow README.md to create your
          first admin and demo learner.
        </li>
      </ol>
      <p>
        Prefer a hosted development project? README.md includes the same
        migration path and email settings.
      </p>
      <Link href="/courses" className="btn btn-primary">
        Browse the preview
      </Link>
    </div>
  );
}
