import { redirect } from "next/navigation";
import { Message } from "@/components/ui";
async function verify(form: FormData) {
  "use server";
  const code = String(form.get("code") || "")
    .trim()
    .toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(code))
    redirect("/verify?message=Enter+a+valid+32-character+verification+code.");
  redirect("/verify/" + code);
}
export default async function Verify({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const s = await searchParams;
  return (
    <div className="shell section narrow">
      <span className="eyebrow">PROGRESS YOU CAN VERIFY</span>
      <h1>
        A real achievement.
        <br />
        <em>A simple check.</em>
      </h1>
      <p>Enter the verification code printed on a Nijo Learn certificate.</p>
      <Message text={s.message} />
      <form className="verify-form" action={verify}>
        <label className="sr-only" htmlFor="verification-code">
          Verification code
        </label>
        <input
          id="verification-code"
          name="code"
          placeholder="32-character verification code"
          required
          minLength={32}
          maxLength={32}
          autoCapitalize="none"
          spellCheck={false}
        />
        <button className="btn btn-primary">Verify certificate ↗</button>
      </form>
      <p className="hint">
        Verification confirms course completion. The learner’s personal details
        are kept private.
      </p>
    </div>
  );
}
