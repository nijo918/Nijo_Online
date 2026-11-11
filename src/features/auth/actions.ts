"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { db, configured } from "@/lib/supabase/server";
import {
  credentialsSchema,
  profileSchema,
  safeNext,
  verificationSchema,
  EMAIL_OTP_LENGTH,
} from "@/lib/rules";
import { requireUser } from "@/lib/auth";
const appUrl = () =>
  new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").origin;
async function rememberVerificationEmail(email: string) {
  (await cookies()).set("nijo-verification-email", email, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/auth/confirmation",
    maxAge: 3600,
  });
}
function back(path: string, message: string, next?: string): never {
  redirect(
    path + "?" + new URLSearchParams({ message, ...(next ? { next } : {}) }),
  );
}
export async function signIn(form: FormData) {
  const next = safeNext(form.get("next"));
  if (!configured()) redirect("/setup");
  const parsed = credentialsSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    back(
      "/auth/sign-in",
      "Enter a valid email and password (at least 10 characters).",
      next,
    );
  const { error } = await (await db()).auth.signInWithPassword(parsed.data);
  if (error)
    back(
      "/auth/sign-in",
      "Unable to sign in. Check your details and confirm your email.",
      next,
    );
  revalidatePath("/", "layout");
  redirect(next);
}
export async function signUp(form: FormData) {
  const next = safeNext(form.get("next"));
  if (!configured()) redirect("/setup");
  const credentials = credentialsSchema.safeParse(Object.fromEntries(form));
  const profile = profileSchema.safeParse(Object.fromEntries(form));
  if (!credentials.success || !profile.success)
    back(
      "/auth/sign-up",
      "Use a name of 2–80 characters, a valid email and a password of 10–128 characters.",
      next,
    );
  const { error } = await (
    await db()
  ).auth.signUp({
    ...credentials.data,
    options: {
      data: profile.data,
    },
  });
  if (error && error.status === 429)
    back("/auth/sign-up", "Please wait a moment before trying again.", next);
  if (error)
    back(
      "/auth/sign-up",
      "Unable to create an account. Try signing in or recovering your password.",
      next,
    );
  await rememberVerificationEmail(credentials.data.email);
  back(
    "/auth/confirmation",
    `If this email needs verification, an ${EMAIL_OTP_LENGTH}-digit signup code will arrive. Already registered? Sign in with your original password or reset it.`,
    next,
  );
}
export async function verifyEmail(form: FormData) {
  if (!configured()) redirect("/setup");
  const next = safeNext(form.get("next"));
  const parsed = verificationSchema.safeParse(Object.fromEntries(form));
  const email = credentialsSchema.shape.email.safeParse(
    String(form.get("email") || "").trim(),
  );
  if (email.success) await rememberVerificationEmail(email.data);
  if (!parsed.success)
    back(
      "/auth/confirmation",
      `Enter your email address and the ${EMAIL_OTP_LENGTH}-digit code from your email.`,
      next,
    );
  const { data, error } = await (
    await db()
  ).auth.verifyOtp({
    email: parsed.data.email,
    token: parsed.data.code,
    type: "email",
  });
  if (error || !data.session || !data.user?.email_confirmed_at)
    back(
      "/auth/confirmation",
      error?.status === 429
        ? "Too many attempts. Please wait a moment before trying again."
        : "That code is invalid or has expired. Try again or request a new code.",
      next,
    );
  (await cookies()).set("nijo-verification-email", "", {
    path: "/auth/confirmation",
    maxAge: 0,
  });
  revalidatePath("/", "layout");
  redirect(next);
}
export async function resend(form: FormData) {
  if (!configured()) redirect("/setup");
  const email = String(form.get("email") || "").trim();
  const next = safeNext(form.get("next"));
  if (!credentialsSchema.shape.email.safeParse(email).success)
    back(
      "/auth/confirmation",
      "Enter a valid email address to request a new code.",
      next,
    );
  await rememberVerificationEmail(email);
  const { error } = await (
    await db()
  ).auth.resend({
    type: "signup",
    email,
  });
  back(
    "/auth/confirmation",
    error?.status === 429
      ? "Please wait a moment before requesting another code."
      : error && error.status && error.status >= 500
        ? "We couldn't send the code right now. Please try again shortly."
        : "If this email is awaiting verification, a new code will arrive shortly. Already confirmed your email? Sign in instead.",
    next,
  );
}
export async function forgotPassword(form: FormData) {
  if (!configured()) redirect("/setup");
  const email = String(form.get("email") || "").trim();
  if (credentialsSchema.shape.email.safeParse(email).success)
    await (
      await db()
    ).auth.resetPasswordForEmail(email, {
      redirectTo: appUrl() + "/auth/callback?recovery=1",
    });
  back(
    "/auth/forgot-password",
    "If an account exists for this email, a password reset link will arrive shortly.",
  );
}
export async function updatePassword(form: FormData) {
  await requireUser("/settings");
  const password = credentialsSchema.shape.password.safeParse(
    form.get("password"),
  );
  if (!password.success)
    back("/auth/update-password", "Choose a password of 10–128 characters.");
  if (form.get("password") !== form.get("confirm_password"))
    back("/auth/update-password", "The passwords do not match.");
  const { error } = await (
    await db()
  ).auth.updateUser({ password: password.data });
  if (error)
    back(
      "/auth/update-password",
      "Unable to change the password. Request a fresh recovery link and try again.",
    );
  redirect("/dashboard?message=Your+password+has+been+updated.");
}
export async function signOut() {
  if (configured()) await (await db()).auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
export async function updateProfile(form: FormData) {
  await requireUser("/settings");
  const parsed = profileSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    back("/settings", "Use a display name of 2–80 characters.");
  const { error } = await (
    await db()
  ).rpc("update_profile", { p_name: parsed.data.display_name });
  if (error)
    back("/settings", "Your profile could not be saved. Please try again.");
  revalidatePath("/", "layout");
  back(
    "/settings",
    "Your display name has been saved. Existing certificates keep their original name.",
  );
}
