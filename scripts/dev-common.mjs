import { createClient } from "@supabase/supabase-js";
export function developmentClient({ localOnly = false } = {}) {
  if (process.env.NIJO_DEV_PROJECT !== "true")
    throw new Error(
      "Set NIJO_DEV_PROJECT=true only for a dedicated development project.",
    );
  const url = new URL(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321",
  );
  if (localOnly && !["127.0.0.1", "localhost"].includes(url.hostname))
    throw new Error("This command is local-only.");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required in .env.local.");
  return createClient(url.href, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export async function findUser(client, email) {
  for (let page = 1; page <= 100; page++) {
    const { data, error } = await client.auth.admin.listUsers({
      page,
      perPage: 100,
    });
    if (error) throw error;
    const user = data.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );
    if (user) return user;
    if (data.users.length < 100) return null;
  }
  throw new Error("User lookup exceeded the development safety limit.");
}
