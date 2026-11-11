import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { updateProfile } from "@/features/auth/actions";
import { Message } from "@/components/ui";
import { Submit } from "@/components/submit";
export default async function Settings({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const user = await requireUser("/settings");
  const s = await searchParams;
  return (
    <div className="shell section narrow">
      <span className="eyebrow">MAKE YOURSELF AT HOME</span>
      <h1>Your profile.</h1>
      <p>Choose the name that appears on your future certificates.</p>
      <Message text={s.message} />
      <form className="stack-form auth-card" action={updateProfile}>
        <label>
          Display name
          <input
            name="display_name"
            defaultValue={user.display_name}
            required
            minLength={2}
            maxLength={80}
          />
        </label>
        <label>
          Email address
          <input value={user.email} readOnly />
          <small>Your email is managed securely by Supabase Auth.</small>
        </label>
        <Submit>Save display name</Submit>
        <Link href="/auth/forgot-password" className="text-link">
          Reset your password →
        </Link>
        <Link href="/dashboard" className="text-link">
          Back to my learning →
        </Link>
      </form>
    </div>
  );
}
