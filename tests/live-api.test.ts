import test from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
test("local Supabase: concurrent enrollment/completion and independent REST authorization", async () => {
  if (
    process.env.NIJO_DEV_PROJECT !== "true" ||
    !["localhost", "127.0.0.1"].includes(new URL(url).hostname)
  )
    throw new Error(
      "Live integration tests are local-only and require NIJO_DEV_PROJECT=true.",
    );
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!service) throw new Error("Set SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  const root = createClient(url, service, { auth: { persistSession: false } });
  const password = "Test-" + randomUUID();
  const clients = [];
  for (const name of ["Learner", "Other", "Admin"]) {
    const email =
      "nijo-test-" + name.toLowerCase() + "-" + randomUUID() + "@example.test";
    const { data, error } = await root.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: "Integration " + name },
    });
    assert.ifError(error);
    const client = createClient(url, key, { auth: { persistSession: false } });
    assert.ifError(
      (await client.auth.signInWithPassword({ email, password })).error,
    );
    clients.push({ client, user: data.user! });
  }
  const [learner, other, admin] = clients;
  assert.ifError(
    (await root.rpc("dev_set_admin", { p_user: admin.user.id })).error,
  );
  const { data: course, error } = await learner.client
    .from("courses")
    .select("*")
    .eq("slug", "networking-basics")
    .single();
  assert.ifError(error);
  const enrolled = await Promise.all(
    Array.from({ length: 8 }, () =>
      learner.client.rpc("enroll", { p_course: course.id }),
    ),
  );
  enrolled.forEach((r) => assert.ifError(r.error));
  const eid = enrolled[0].data;
  assert.ok(enrolled.every((r) => r.data === eid));
  assert.deepEqual(
    (await other.client.from("enrollments").select("*").eq("id", eid)).data,
    [],
  );
  assert.equal(
    (
      await learner.client
        .from("enrollments")
        .update({ completed_at: new Date().toISOString() })
        .eq("id", eid)
    ).error?.code,
    "42501",
  );
  assert.ok(
    (await learner.client.rpc("admin_get_draft", { p_id: course.id })).error,
  );
  const rawKeys = await fetch(url + "/rest/v1/answer_keys?select=*", {
    headers: {
      apikey: key,
      Authorization:
        "Bearer " +
        (await learner.client.auth.getSession()).data.session!.access_token,
      "Accept-Profile": "private",
    },
  });
  assert.ok(rawKeys.status >= 400);
  const { data: mods } = await learner.client
    .from("modules")
    .select("lessons(id)")
    .eq("course_id", course.id);
  const lessons = mods!.flatMap((m) => m.lessons);
  assert.ok(lessons.length);
  const finish = await Promise.all(
    lessons.flatMap((l) => [
      learner.client.rpc("touch_lesson", {
        p_enrollment: eid,
        p_lesson: l.id,
        p_complete: true,
      }),
      learner.client.rpc("touch_lesson", {
        p_enrollment: eid,
        p_lesson: l.id,
        p_complete: true,
      }),
    ]),
  );
  finish.forEach((r) => assert.ifError(r.error));
  const before = await learner.client
    .from("certificates")
    .select("*")
    .eq("enrollment_id", eid);
  assert.deepEqual(before.data, []);
  const draft = (await admin.client.rpc("admin_get_draft", { p_id: course.id }))
    .data;
  const { data: quizzes } = await learner.client
    .from("assessments")
    .select("id,title,position")
    .eq("course_id", course.id)
    .order("position");
  for (const a of quizzes!) {
    const { data: questions } = await learner.client
      .from("questions")
      .select("id,position,options(id,position)")
      .eq("assessment_id", a.id)
      .order("position");
    const answers: Record<string, string> = {};
    for (const q of questions!) {
      const expected =
        draft.assessments[a.position].questions[q.position].correct_index;
      answers[q.id] = q.options.find((o) => o.position === expected)!.id;
    }
    const request = randomUUID();
    const results = await Promise.all(
      Array.from({ length: 4 }, () =>
        learner.client.rpc("submit_quiz", {
          p_enrollment: eid,
          p_assessment: a.id,
          p_answers: answers,
          p_request: request,
        }),
      ),
    );
    results.forEach((r) => {
      assert.ifError(r.error);
      assert.equal(r.data.passed, true);
    });
    assert.ok(results.every((r) => r.data.id === results[0].data.id));
  }
  const { data: certificates } = await learner.client
    .from("certificates")
    .select("*")
    .eq("enrollment_id", eid);
  assert.equal(certificates?.length, 1);
  const code = certificates![0].verification_code;
  const anonymous = createClient(url, key, { auth: { persistSession: false } });
  const verified = await anonymous.rpc("verify_certificate", { p_code: code });
  assert.ifError(verified.error);
  assert.deepEqual(Object.keys(verified.data[0]).sort(), [
    "course_title",
    "issued_at",
    "issuer",
    "valid",
  ]);
  assert.deepEqual(
    (
      await other.client
        .from("certificates")
        .select("*")
        .eq("enrollment_id", eid)
    ).data,
    [],
  );
  // Keep completed records as evidence in this disposable local stack; db reset removes them.
  clients.forEach((c) => void c.client.auth.signOut());
});
