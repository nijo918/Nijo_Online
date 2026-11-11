"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/supabase/server";
import { uuid } from "@/lib/rules";
import { draftSchema } from "./validation";
export async function saveDraft(
  input: unknown,
  id?: string,
): Promise<{ id?: string; error?: string }> {
  await requireAdmin();
  const p = draftSchema.safeParse(input);
  if (!p.success)
    return {
      error: p.error.issues
        .map((i) => i.path.join(".") + ": " + i.message)
        .slice(0, 3)
        .join("; "),
    };
  if (id && !uuid.safeParse(id).success)
    return { error: "Invalid draft identifier." };
  const { data, error } = await (
    await db()
  ).rpc("admin_save_draft", { p_data: p.data, p_id: id || null });
  if (error)
    return {
      error:
        error.code === "23505"
          ? "That course slug is already in use. Choose a unique slug."
          : "The draft could not be saved. Check the fields and ensure this edition is still a draft.",
    };
  revalidatePath("/admin");
  revalidatePath("/admin/courses/" + data);
  return { id: data };
}
export async function lifecycle(form: FormData) {
  await requireAdmin();
  const id = uuid.parse(form.get("course_id"));
  const action = z
    .enum(["publish", "archive", "duplicate"])
    .parse(form.get("action"));
  const { data, error } = await (
    await db()
  ).rpc("admin_lifecycle", { p_id: id, p_action: action });
  if (error) {
    const allowed = [
      "Add a summary",
      "Add at least",
      "Every lesson",
      "Each assessment",
      "Each question",
      "Each module",
    ];
    const message = allowed.some((x) => error.message.startsWith(x))
      ? error.message
      : "This action could not be completed. Check that the course is in the correct state.";
    redirect(
      "/admin/courses/" + id + "?message=" + encodeURIComponent(message),
    );
  }
  revalidatePath("/", "layout");
  redirect(
    "/admin/courses/" +
      data +
      "?message=" +
      encodeURIComponent(
        action === "publish"
          ? "Course published. This edition is now immutable."
          : action === "archive"
            ? "Edition archived. Existing learners keep access."
            : "New draft edition created.",
      ),
  );
}
export async function saveCategory(form: FormData) {
  await requireAdmin();
  const p = z
    .object({
      name: z.string().trim().min(2).max(80),
      slug: z
        .string()
        .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
        .max(100),
    })
    .safeParse(Object.fromEntries(form));
  if (!p.success)
    redirect(
      "/admin/categories?message=Use+a+name+and+a+lowercase+slug+with+hyphens.",
    );
  const id = form.get("id");
  const { error } = await (
    await db()
  ).rpc("admin_category", {
    p_id: id ? uuid.parse(id) : null,
    p_name: p.data.name,
    p_slug: p.data.slug,
  });
  revalidatePath("/", "layout");
  redirect(
    "/admin/categories?message=" +
      encodeURIComponent(
        error
          ? "The category could not be saved. Names and slugs must be unique."
          : "Category saved.",
      ),
  );
}
