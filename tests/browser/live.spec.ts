import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
test.describe("live local learning and administration", () => {
  test.skip(
    process.env.E2E_LIVE !== "1",
    "Set E2E_LIVE=1 with a configured local Supabase stack.",
  );
  test("learner completes course, retakes a quiz and downloads a private PDF", async ({
    page,
  }) => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    if (!["localhost", "127.0.0.1"].includes(new URL(url).hostname))
      throw new Error("Local-only tests.");
    const root = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });
    const email = "browser-" + randomUUID() + "@example.test",
      password = "Browser-" + randomUUID();
    const { error } = await root.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: "Browser Learner" },
    });
    expect(error).toBeNull();
    await page.goto("/courses/networking-basics");
    await page.getByRole("button", { name: /Enroll for free/ }).click();
    await expect(page).toHaveURL(/auth\/sign-in/);
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.getByRole("button", { name: /Enroll for free/ }).click();
    await expect(page).toHaveURL(/\/learn\//);
    const learningUrl = page.url();
    await page.reload();
    await expect(
      page.getByRole("heading", {
        name: "A network is a conversation",
        exact: true,
      }),
    ).toBeVisible();
    for (let i = 0; i < 4; i++) {
      await page
        .getByRole("button", { name: /Mark complete & continue/ })
        .click();
    }
    await expect(
      page.getByRole("heading", {
        name: "Connections checkpoint",
        exact: true,
      }),
    ).toBeVisible();
    const wrong = [
      "A monitor",
      "Charge its battery",
      "Every website is online",
    ];
    for (const label of wrong)
      await page.getByLabel(label, { exact: true }).check();
    await page.getByRole("button", { name: "Submit assessment" }).click();
    await expect(
      page.getByRole("heading", { name: "Not quite there yet." }),
    ).toBeVisible();
    for (const label of [
      "A router",
      "Resolve a domain name to an address",
      "The wireless link has a strong signal",
    ])
      await page.getByLabel(label, { exact: true }).check();
    await page.getByRole("button", { name: "Submit another attempt" }).click();
    await expect(
      page.getByRole("heading", { name: "Assessment passed." }),
    ).toBeVisible();
    await page
      .getByRole("link", { name: "Networking final assessment", exact: true })
      .click();
    for (const label of [
      "Describe the symptom and its scope",
      "The affected laptop’s local connection",
      "Recording one change and its result",
      "A route toward other networks",
    ])
      await page.getByLabel(label, { exact: true }).check();
    await page.getByRole("button", { name: "Submit assessment" }).click();
    await page.getByRole("link", { name: "Your certificate is ready" }).click();
    await expect(
      page.getByRole("heading", { name: "Browser Learner", exact: true }),
    ).toBeVisible();
    const download = page.waitForEvent("download");
    await page.getByRole("link", { name: "Download PDF" }).click();
    expect((await download).suggestedFilename()).toBe(
      "nijo-learn-certificate.pdf",
    );
    await page.getByRole("link", { name: "Verify certificate" }).click();
    await expect(
      page.getByRole("heading", { name: "Achievement confirmed." }),
    ).toBeVisible();
    await expect(
      page.getByText("Browser Learner", { exact: true }),
    ).toHaveCount(0);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/dashboard/);
    await page.goto(learningUrl);
    await expect(page.getByText("100%", { exact: true })).toBeVisible();
  });
  test("admin edits a duplicate, previews, publishes and archives it", async ({
    page,
  }) => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    if (!["localhost", "127.0.0.1"].includes(new URL(url).hostname))
      throw new Error("Local-only tests.");
    const root = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });
    const email = "admin-browser-" + randomUUID() + "@example.test",
      password = "Admin-" + randomUUID();
    const { data, error } = await root.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: "Browser Admin" },
    });
    expect(error).toBeNull();
    expect(
      (await root.rpc("dev_set_admin", { p_user: data.user!.id })).error,
    ).toBeNull();
    await page.goto("/auth/sign-in?next=/admin");
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: /Make learning/ }),
    ).toBeVisible();
    await page
      .getByRole("row")
      .filter({ hasText: "Networking Basics" })
      .first()
      .getByRole("link", { name: "Open" })
      .click();
    await page.getByRole("button", { name: "Duplicate as new draft" }).click();
    await expect(
      page.getByLabel("Course title", { exact: true }),
    ).toBeVisible();
    await page
      .getByLabel("Course title", { exact: true })
      .fill("Browser Edition " + Date.now());
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect(page.getByText(/Draft saved/)).toBeVisible();
    const edit = page.url();
    await page
      .getByRole("link", { name: "Preview saved version", exact: true })
      .click();
    await expect(page.getByText(/Admin preview/)).toBeVisible();
    await page.goto(edit);
    await page.getByRole("button", { name: "Publish saved draft" }).click();
    await expect(
      page.getByRole("heading", { name: "This edition is preserved." }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Archive edition" }).click();
    await expect(page.getByText(/EDITION 2 · ARCHIVED/)).toBeVisible();
  });
});
