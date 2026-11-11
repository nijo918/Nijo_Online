import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
test("invalid email codes preserve the address without creating a session", async ({
  page,
  context,
}) => {
  test.skip(
    !process.env.NEXT_PUBLIC_SUPABASE_URL,
    "Requires a configured Supabase endpoint.",
  );
  const email = "invalid-otp-" + randomUUID() + "@example.test";
  await page.goto("/auth/confirmation?next=//evil.example");
  await page.getByLabel("Email address", { exact: true }).fill(email);
  await page.getByLabel("Verification code").fill("00000000");
  await page.getByRole("button", { name: "Verify email", exact: true }).click();
  await expect(
    page.getByText(/That code is invalid or has expired/),
  ).toBeVisible();
  await expect(page.getByLabel("Email address", { exact: true })).toHaveValue(
    email,
  );
  expect(page.url()).not.toContain(encodeURIComponent(email));
  expect(page.url()).not.toContain("00000000");
  await expect(page.locator("input[name=next]")).toHaveValue("/dashboard");
  const cookies = await context.cookies();
  expect(
    cookies.find((cookie) => cookie.name === "nijo-verification-email"),
  ).toMatchObject({ httpOnly: true, path: "/auth/confirmation" });
  expect(cookies.some((cookie) => /^sb-.*-auth-token/.test(cookie.name))).toBe(
    false,
  );
});
test("email verification offers an eight-digit code and resend without requiring a code", async ({
  page,
}) => {
  await page.goto("/auth/confirmation?next=//evil.example");
  const code = page.getByLabel("Verification code");
  await expect(
    page.getByText(/If you already confirmed your email, sign in instead/),
  ).toBeVisible();
  await expect(code).toBeVisible();
  await expect(code).toHaveAttribute("autocomplete", "one-time-code");
  await expect(code).toHaveAttribute("inputmode", "numeric");
  await expect(code).toHaveAttribute("maxlength", "8");
  await expect(page.locator("input[name=next]")).toHaveValue("/dashboard");
  await page.getByLabel("Email address").fill("otp-validation@example.test");
  await code.fill("1234567");
  await page.getByRole("button", { name: "Verify email", exact: true }).click();
  expect(
    await code.evaluate((input: HTMLInputElement) => input.validity.valid),
  ).toBe(false);
  await expect(page).toHaveURL(/\/auth\/confirmation/);
  await expect(
    page.getByRole("button", { name: "Resend code", exact: true }),
  ).toHaveAttribute("formnovalidate", "");
});
test("home, course exploration, search and detail work at this viewport", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /A little learning/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/home-" + info.project.name + ".png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Find your next course" }).click();
  await expect(page).toHaveURL(/\/courses/);
  await page
    .getByRole("textbox", { name: "Search courses" })
    .fill("Networking");
  await page.getByRole("button", { name: "Find courses" }).click();
  await expect(
    page.getByRole("heading", { name: "Networking Basics", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Excel for Beginners", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("link", { name: "Networking Basics", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Networking Basics", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Explain how devices communicate on a local network"),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/course-" + info.project.name + ".png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("empty search, recovery and invalid certificate states are clear", async ({
  page,
}) => {
  await page.goto("/courses?q=no-such-course-283742");
  await expect(
    page.getByRole("heading", { name: "A new direction awaits" }),
  ).toBeVisible();
  await page.goto("/auth/sign-in?next=//evil.example");
  await expect(
    page.getByRole("heading", { name: "Welcome back." }),
  ).toBeVisible();
  await expect(page.locator("input[name=next]")).toHaveValue("/dashboard");
  await page.getByRole("link", { name: "Forgot your password?" }).click();
  await expect(
    page.getByRole("textbox", { name: "Email address" }),
  ).toBeVisible();
  await page.goto("/verify/" + "0".repeat(32));
  await expect(
    page.getByRole("heading", { name: "Certificate not found." }),
  ).toBeVisible();
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/auth\/sign-in/);
});
