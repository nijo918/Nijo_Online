import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import {
  signIn,
  signUp,
  resend,
  verifyEmail,
  forgotPassword,
  updatePassword,
} from "@/features/auth/actions";
import { Message } from "@/components/ui";
import { Submit } from "@/components/submit";
import { safeNext, EMAIL_OTP_LENGTH } from "@/lib/rules";
import { requireUser } from "@/lib/auth";
const screens = {
  "sign-in": {
    title: "Welcome back.",
    intro: "Your next step is waiting for you.",
    action: signIn,
    button: "Sign in",
  },
  "sign-up": {
    title: "Begin something good.",
    intro: "Create your free account. A little curiosity is all you need.",
    action: signUp,
    button: "Create free account",
  },
  confirmation: {
    title: "Enter your signup code.",
    intro: `New accounts receive an ${EMAIL_OTP_LENGTH}-digit code by email. If you already confirmed your email, sign in instead.`,
    action: verifyEmail,
    button: "Verify email",
  },
  "forgot-password": {
    title: "Let’s get you back in.",
    intro:
      "Enter your email and we’ll send a password reset link if an account exists.",
    action: forgotPassword,
    button: "Send recovery link",
  },
  "update-password": {
    title: "A fresh start.",
    intro: "Choose a new password for your account.",
    action: updatePassword,
    button: "Update password",
  },
};
export default async function AuthPage({
  params,
  searchParams,
}: {
  params: Promise<{ screen: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { screen } = await params;
  if (!(screen in screens)) notFound();
  const s = await searchParams;
  const config = screens[screen as keyof typeof screens];
  const verificationEmail =
    screen === "confirmation"
      ? (await cookies()).get("nijo-verification-email")?.value || ""
      : "";
  if (screen === "update-password") await requireUser("/settings");
  return (
    <section className="auth-section">
      <div className="auth-card">
        <span className="eyebrow">YOUR LEARNING, YOUR POSSIBILITIES</span>
        <h1>{config.title}</h1>
        <p>{config.intro}</p>
        <Message text={s.message} />
        <form action={config.action} className="stack-form">
          <input type="hidden" name="next" value={safeNext(s.next)} />
          {screen === "sign-up" && (
            <label>
              Display name
              <input
                name="display_name"
                autoComplete="name"
                required
                minLength={2}
                maxLength={80}
              />
            </label>
          )}
          {screen !== "update-password" && (
            <label>
              Email address
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                maxLength={254}
                defaultValue={verificationEmail}
              />
            </label>
          )}
          {screen === "confirmation" && (
            <label>
              Verification code
              <input
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern={`[0-9]{${EMAIL_OTP_LENGTH}}`}
                minLength={EMAIL_OTP_LENGTH}
                maxLength={EMAIL_OTP_LENGTH}
                required
                aria-describedby="verification-help"
              />
              <small id="verification-help">
                Use the latest code from your inbox.
              </small>
            </label>
          )}
          {["sign-in", "sign-up", "update-password"].includes(screen) && (
            <label>
              {screen === "update-password" ? "New password" : "Password"}
              <input
                type="password"
                name="password"
                required
                minLength={10}
                maxLength={128}
                autoComplete={
                  screen === "sign-in" ? "current-password" : "new-password"
                }
              />
              {screen !== "sign-in" && (
                <small>At least 10 characters. Use a unique passphrase.</small>
              )}
            </label>
          )}
          {screen === "update-password" && (
            <label>
              Confirm new password
              <input
                type="password"
                name="confirm_password"
                required
                minLength={10}
                maxLength={128}
                autoComplete="new-password"
              />
            </label>
          )}
          <Submit pending="One moment…">{config.button}</Submit>
          {screen === "confirmation" && (
            <button
              type="submit"
              formAction={resend}
              formNoValidate
              className="btn btn-secondary"
            >
              Resend code
            </button>
          )}
        </form>
        <div className="form-links">
          {screen === "sign-in" ? (
            <>
              <Link href="/auth/forgot-password">Forgot your password?</Link>
              <span>
                New here?{" "}
                <Link
                  href={
                    "/auth/sign-up?next=" + encodeURIComponent(safeNext(s.next))
                  }
                >
                  Create a free account
                </Link>
              </span>
              <Link href="/auth/confirmation">Verify email or resend code</Link>
            </>
          ) : (
            <Link
              href={
                "/auth/sign-in?next=" + encodeURIComponent(safeNext(s.next))
              }
            >
              Back to sign in
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
