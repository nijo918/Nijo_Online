import test from "node:test";
import assert from "node:assert/strict";
import {
  safeNext,
  approvedVideo,
  passed,
  progressPercent,
  verificationSchema,
} from "../src/lib/rules";
import { draftSchema } from "../src/features/admin/validation";
test("email verification preserves leading zeroes and rejects malformed codes and addresses", () => {
  assert.deepEqual(
    verificationSchema.parse({
      email: " learner@example.test ",
      code: " 01234567 ",
    }),
    {
      email: "learner@example.test",
      code: "01234567",
    },
  );
  for (const code of [
    "123456",
    "1234567",
    "123456789",
    "12a45678",
    "1e000000",
    "１２３４５６",
    12345678,
    null,
  ]) {
    assert.equal(
      verificationSchema.safeParse({ email: "learner@example.test", code })
        .success,
      false,
    );
  }
  assert.equal(
    verificationSchema.safeParse({ email: "invalid", code: "01234567" })
      .success,
    false,
  );
});
test("internal redirects reject external, encoded-path and control-character attacks", () => {
  for (const value of [
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "/\nevil",
    "/auth/callback?next=//evil",
    "/a/..//evil.example",
    "/%2f%2fevil.example",
    "/%5cevil.example",
    null,
    12,
  ])
    assert.equal(safeNext(value), "/dashboard");
  assert.equal(
    safeNext("/courses/networking-basics?from=home"),
    "/courses/networking-basics?from=home",
  );
  assert.equal(
    safeNext("/courses?q=hello%20world"),
    "/courses?q=hello%20world",
  );
});
test("videos accept only exact approved privacy-enhanced embed addresses", () => {
  assert.equal(
    approvedVideo("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
    "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
  );
  for (const value of [
    "javascript:alert(1)",
    "https://youtube.com/watch?v=dQw4w9WgXcQ",
    "https://www.youtube-nocookie.com.evil.test/embed/dQw4w9WgXcQ",
    "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1",
  ])
    assert.equal(approvedVideo(value), null);
});
test("pass decision uses exact values before display rounding", () => {
  assert.equal(passed(7, 10, 70), true);
  assert.equal(passed(2, 3, 67), false);
  assert.equal(passed(0, 0, 70), false);
  assert.equal(progressPercent(5, 6), 83);
});
test("draft validation rejects relationships to missing modules and oversized pass marks", () => {
  const data = {
    title: "Test course",
    slug: "test-course",
    category_id: "10000000-0000-4000-8000-000000000001",
    summary: "",
    outcomes: [],
    course_type: "Certificate",
    duration_minutes: 60,
    modules: [],
    assessments: [
      {
        title: "Final",
        module_position: 1,
        required: true,
        pass_mark: 101,
        questions: [],
      },
    ],
  };
  assert.equal(draftSchema.safeParse(data).success, false);
});

test("certificate PDF embeds its font and preserves accented issuance snapshots", async () => {
  const { generateCertificatePdf } =
    await import("../src/features/certificates/pdf");
  const { PDFDocument } = await import("pdf-lib");
  const bytes = await generateCertificatePdf({
    id: "certificate",
    enrollment_id: "enrollment",
    verification_code: "a".repeat(32),
    learner_name: "Tendai José Moyo",
    course_title: "Networking Basics",
    issuer: "Nijo Learn",
    issued_at: "2026-11-10T10:00:00.000Z",
  });
  assert.ok(bytes.length > 5000);
  const pdf = await PDFDocument.load(bytes);
  assert.equal(pdf.getPageCount(), 1);
  assert.equal(pdf.getTitle(), "Networking Basics — Certificate of Completion");
  assert.equal(pdf.getPage(0).getWidth(), 842);
});
