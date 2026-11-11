import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { db, configured } from "@/lib/supabase/server";
import { safeNext } from "@/lib/rules";
export const currentUser = cache(async () => {
  if (!configured()) return null;
  const client = await db();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;
  const [{ data: profile }, { data: admin }] = await Promise.all([
    client
      .from("profiles")
      .select("display_name")
      .eq("id", data.user.id)
      .single(),
    client.rpc("is_admin"),
  ]);
  return {
    ...data.user,
    display_name: profile?.display_name || "Learner",
    isAdmin: admin === true,
  };
});
export async function requireUser(next = "/dashboard") {
  const user = await currentUser();
  if (!user || !user.email_confirmed_at)
    redirect(
      "/auth/sign-in?next=" +
        encodeURIComponent(safeNext(next)) +
        "&message=Please+sign+in+with+a+verified+account.",
    );
  return user;
}
export async function requireAdmin() {
  const user = await requireUser("/admin");
  if (!user.isAdmin)
    redirect("/dashboard?message=Administrator+access+is+required.");
  return user;
}
