import "server-only";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/supabase/server";
import { uuid } from "@/lib/rules";
import type { Certificate } from "@/features/courses/types";
export async function ownedCertificate(id: string): Promise<Certificate> {
  await requireUser("/certificates/" + id);
  if (!uuid.safeParse(id).success) notFound();
  const { data, error } = await (
    await db()
  )
    .from("certificates")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("Certificate could not be loaded.");
  if (!data) notFound();
  return data;
}
