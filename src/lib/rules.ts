import { z } from "zod";
export function safeNext(value: unknown, fallback = "/dashboard"): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u0020]/.test(value)
  )
    return fallback;
  try {
    const url = new URL(value, "https://nijo.invalid");
    const decoded = decodeURIComponent(url.pathname);
    return url.origin === "https://nijo.invalid" &&
      !decoded.startsWith("//") &&
      !decoded.includes(String.fromCharCode(92)) &&
      !decoded.startsWith("/auth/") &&
      !/[\u0000-\u0020]/.test(decoded)
      ? url.pathname + url.search + url.hash
      : fallback;
  } catch {
    return fallback;
  }
}
export function approvedVideo(value?: string | null): string | null {
  if (!value) return null;
  try {
    const u = new URL(value);
    return u.protocol === "https:" &&
      u.hostname === "www.youtube-nocookie.com" &&
      /^\/embed\/[a-zA-Z0-9_-]{11}$/.test(u.pathname) &&
      !u.username &&
      !u.password &&
      !u.port &&
      !u.search &&
      !u.hash
      ? u.href
      : null;
  } catch {
    return null;
  }
}
export const uuid = z.uuid();
export const profileSchema = z.object({
  display_name: z.string().trim().min(2).max(80),
});
export const credentialsSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(10).max(128),
});
export const EMAIL_OTP_LENGTH = 8;
export const verificationSchema = z.object({
  email: z.string().trim().email().max(254),
  code: z.string().trim().length(EMAIL_OTP_LENGTH).regex(/^\d+$/),
});
export function progressPercent(done: number, total: number) {
  return total > 0 ? Math.min(100, Math.floor((done * 100) / total)) : 0;
}
export function passed(correct: number, total: number, passMark: number) {
  return total > 0 && correct * 100 >= passMark * total;
}
export function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "Africa/Harare",
  }).format(new Date(date));
}
