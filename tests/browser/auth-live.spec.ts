import { test, expect, type APIRequestContext } from "@playwright/test";
import { randomUUID } from "node:crypto";
async function emailMessage(
  request: APIRequestContext,
  email: string,
  subject: string,
) {
  let id = "";
  await expect
    .poll(
      async () => {
        const response = await request.get(
          "http://127.0.0.1:54324/api/v1/search",
          { params: { query: "to:" + email } },
        );
        if (!response.ok()) return false;
        const data = await response.json();
        id =
          data.messages?.find((m: { ID: string; Subject: string }) =>
            m.Subject.includes(subject),
          )?.ID || "";
        return Boolean(id);
      },
      { timeout: 20000 },
    )
    .toBe(true);
  const message = await (
    await request.get("http://127.0.0.1:54324/api/v1/message/" + id)
  ).json();
  return String(message.HTML);
}
async function emailLink(
  request: APIRequestContext,
  email: string,
  subject: string,
) {
  const html = await emailMessage(request, email, subject);
  const href = html.match(/href="([^"]+)"/)?.[1]?.replace(/&amp;/g, "&");
  if (!href || new URL(href).hostname !== "localhost")
    throw new Error("Expected an app callback link in local Mailpit.");
  return href;
}
test.describe("live local email flows", () => {
  test.skip(
    process.env.E2E_LIVE !== "1",
    "Requires the configured local Supabase/Mailpit stack.",
  );
  test("signup, OTP confirmation, rejected reuse, recovery and session expiry", async ({
    page,
    request,
    context,
  }) => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    if (!["localhost", "127.0.0.1"].includes(new URL(url).hostname))
      throw new Error("Local-only tests.");
    const email = "signup-" + randomUUID() + "@example.test",
      password = "Learning-" + randomUUID(),
      newPassword = "Recovery-" + randomUUID();
    await page.goto("/auth/sign-up?next=/courses/networking-basics");
    await page.getByLabel("Display name").fill("Email Flow Learner");
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel(/^Password/).fill(password);
    await page.getByRole("button", { name: "Create free account" }).click();
    await expect(
      page.getByRole("heading", { name: "Enter your signup code." }),
    ).toBeVisible();
    await expect(page.getByLabel("Email address")).toHaveValue(email);
    const html = await emailMessage(
      request,
      email,
      "Your Nijo Learn verification code",
    );
    const code = html.match(/>\s*(\d{8})\s*</)?.[1];
    if (!code)
      throw new Error(
        "Expected an eight-digit verification code in local Mailpit.",
      );
    expect(html).not.toContain("token_hash=");
    const wrongCode = ((Number(code[0]) + 1) % 10) + code.slice(1);
    await page.getByLabel("Verification code").fill(wrongCode);
    await page
      .getByRole("button", { name: "Verify email", exact: true })
      .click();
    await expect(
      page.getByText(/That code is invalid or has expired/),
    ).toBeVisible();
    await expect(page.getByLabel("Email address")).toHaveValue(email);
    await page.getByLabel("Verification code").fill(code);
    await page
      .getByRole("button", { name: "Verify email", exact: true })
      .click();
    await expect(page).toHaveURL(/\/courses\/networking-basics/);
    await expect(
      page.getByRole("link", { name: "My learning", exact: true }).first(),
    ).toBeVisible();
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await page.goto("/auth/confirmation");
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Verification code").fill(code);
    await page
      .getByRole("button", { name: "Verify email", exact: true })
      .click();
    await expect(
      page.getByText(/That code is invalid or has expired/),
    ).toBeVisible();
    await page.goto("/auth/forgot-password");
    await page.getByLabel("Email address").fill(email);
    await page.getByRole("button", { name: "Send recovery link" }).click();
    await expect(page.getByText(/If an account exists/)).toBeVisible();
    const recovery = await emailLink(
      request,
      email,
      "Reset your Nijo Learn password",
    );
    await page.goto(recovery);
    await expect(
      page.getByRole("heading", { name: "A fresh start." }),
    ).toBeVisible();
    await page.getByLabel(/^New password/).fill(newPassword);
    await page
      .getByLabel("Confirm new password", { exact: true })
      .fill(newPassword);
    await page.getByRole("button", { name: "Update password" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await context.clearCookies();
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/auth\/sign-in/);
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel(/^Password/).fill(newPassword);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
