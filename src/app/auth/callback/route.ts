import { NextResponse, type NextRequest } from "next/server";
import { db, configured } from "@/lib/supabase/server";
import { safeNext } from "@/lib/rules";
export async function GET(request: NextRequest) {
  if (!configured())
    return NextResponse.redirect(
      new URL("/setup", process.env.NEXT_PUBLIC_APP_URL || request.url),
    );
  const url = request.nextUrl;
  const client = await db();
  const code = url.searchParams.get("code");
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  let success = false;
  if (code) {
    const { error } = await client.auth.exchangeCodeForSession(code);
    success = !error;
  } else if (
    token_hash &&
    (type === "email" || type === "signup" || type === "recovery")
  ) {
    const { error } = await client.auth.verifyOtp({ token_hash, type });
    success = !error;
  }
  const recovery =
    url.searchParams.get("recovery") === "1" || type === "recovery";
  const target = success
    ? recovery
      ? "/auth/update-password"
      : safeNext(url.searchParams.get("next"))
    : "/auth/sign-in?message=This+link+has+expired+or+was+already+used.+Verify+your+email+with+a+new+code+or+request+a+new+recovery+link.";
  return NextResponse.redirect(
    new URL(target, process.env.NEXT_PUBLIC_APP_URL || request.url),
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
