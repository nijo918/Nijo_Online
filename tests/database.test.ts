import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { randomUUID } from "node:crypto";
const learner = "30000000-0000-4000-8000-000000000001",
  other = "30000000-0000-4000-8000-000000000002",
  admin = "30000000-0000-4000-8000-000000000003";
const pg = new PGlite();
async function actor<T>(
  uid: string | null,
  fn: () => Promise<T>,
  role = "authenticated",
) {
  await pg.exec("set role " + role);
  await pg.query("select set_config('request.jwt.claim.sub',$1,false)", [
    uid || "",
  ]);
  try {
    return await fn();
  } finally {
    await pg.exec("reset role");
  }
}
const rows = async (sql: string, params: unknown[] = []) =>
  (await pg.query<Record<string, unknown>>(sql, params)).rows;
const scalar = async (sql: string, params: unknown[] = []) =>
  Object.values((await rows(sql, params))[0] || {})[0];
async function expectDenied(fn: () => Promise<unknown>) {
  await assert.rejects(fn);
}
test("PostgreSQL migration, data isolation, grading and course lifecycle", async (t) => {
  await pg.exec(
    "create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}'::jsonb); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;",
  );
  const migrations = (await fs.readdir("supabase/migrations"))
    .filter((n) => n.endsWith(".sql"))
    .sort();
  assert.ok(migrations.length);
  for (const file of migrations)
    await pg.exec(await fs.readFile("supabase/migrations/" + file, "utf8"));
  await pg.exec(await fs.readFile("supabase/seed.sql", "utf8"));
  await pg.query(
    "insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,'learner@example.test',now(),'{\"display_name\":\"First Learner\"}'),($2,'other@example.test',now(),'{\"display_name\":\"Second Learner\"}'),($3,'admin@example.test',now(),'{\"display_name\":\"Demo Admin\"}')",
    [learner, other, admin],
  );
  await pg.query("insert into private.admin_members(user_id) values($1)", [
    admin,
  ]);
  const course = String(
    await scalar(
      "select id from public.courses where slug='networking-basics'",
    ),
  );
  const lessons = await rows(
    "select l.id,m.position module_position from public.lessons l join public.modules m on m.id=l.module_id where m.course_id=$1 order by m.position,l.position",
    [course],
  );
  const quizzes = await rows(
    "select * from public.assessments where course_id=$1 order by position",
    [course],
  );
  let eid = "";
  await t.test(
    "anonymous sees published catalog and metadata, no lesson bodies or answers",
    async () =>
      actor(
        null,
        async () => {
          assert.equal(
            await scalar("select count(*)::int from public.courses"),
            3,
          );
          await expectDenied(() =>
            pg.exec("select * from public.lesson_bodies"),
          );
          await expectDenied(() =>
            pg.exec("select * from private.answer_keys"),
          );
          await expectDenied(() =>
            pg.query("select public.enroll($1)", [course]),
          );
        },
        "anon",
      ),
  );
  await t.test("duplicate enrollment converges on one record", async () =>
    actor(learner, async () => {
      eid = String(await scalar("select public.enroll($1)", [course]));
      assert.equal(await scalar("select public.enroll($1)", [course]), eid);
      assert.equal(
        await scalar("select count(*)::int from public.enrollments"),
        1,
      );
    }),
  );
  await t.test(
    "client cannot forge scores, completion, roles or certificates",
    async () =>
      actor(learner, async () => {
        await expectDenied(() =>
          pg.query(
            "update public.enrollments set completed_at=now() where id=$1",
            [eid],
          ),
        );
        await expectDenied(() =>
          pg.query("insert into private.admin_members(user_id) values($1)", [
            learner,
          ]),
        );
        await expectDenied(() => pg.exec("select * from private.answer_keys"));
        await expectDenied(() =>
          pg.query("select public.admin_get_draft($1)", [course]),
        );
        await expectDenied(() =>
          pg.query("select public.dev_set_admin($1)", [learner]),
        );
        assert.equal(
          await scalar("select count(*)::int from public.certificates"),
          0,
        );
      }),
  );
  await t.test(
    "other learner cannot access progress, content, attempts or mutations",
    async () =>
      actor(other, async () => {
        assert.equal(
          await scalar("select count(*)::int from public.enrollments"),
          0,
        );
        assert.equal(
          await scalar("select count(*)::int from public.lesson_bodies"),
          0,
        );
        assert.equal(
          await scalar("select count(*)::int from public.questions"),
          0,
        );
        await expectDenied(() =>
          pg.query("select public.touch_lesson($1,$2,true)", [
            eid,
            lessons[0].id,
          ]),
        );
      }),
  );
  await t.test(
    "early quizzes and certification are blocked; last opened is not completion",
    async () =>
      actor(learner, async () => {
        assert.equal(
          await scalar("select public.quiz_unlocked($1,$2)", [
            eid,
            quizzes[0].id,
          ]),
          false,
        );
        await expectDenied(() =>
          pg.query("select public.submit_quiz($1,$2,$3,$4)", [
            eid,
            quizzes[0].id,
            {},
            randomUUID(),
          ]),
        );
        await pg.query("select public.touch_lesson($1,$2,false)", [
          eid,
          lessons[0].id,
        ]);
        assert.equal(
          await scalar("select count(*)::int from public.lesson_progress"),
          0,
        );
        assert.equal(
          await scalar(
            "select last_lesson_id from public.enrollments where id=$1",
            [eid],
          ),
          lessons[0].id,
        );
      }),
  );
  await t.test(
    "required lessons persist and duplicate completion remains one row",
    async () =>
      actor(learner, async () => {
        for (const l of lessons)
          await pg.query("select public.touch_lesson($1,$2,true)", [eid, l.id]);
        await pg.query("select public.touch_lesson($1,$2,true)", [
          eid,
          lessons[0].id,
        ]);
        assert.equal(
          await scalar("select count(*)::int from public.lesson_progress"),
          lessons.length,
        );
        assert.equal(
          await scalar("select count(*)::int from public.certificates"),
          0,
        );
        assert.equal(
          await scalar("select public.quiz_unlocked($1,$2)", [
            eid,
            quizzes[0].id,
          ]),
          true,
        );
      }),
  );
  const answers = async (aid: unknown, correct = true) => {
    const keys = await rows(
      "select q.id,k.option_id from public.questions q join private.answer_keys k on k.question_id=q.id where q.assessment_id=$1",
      [aid],
    );
    const result: Record<string, string> = {};
    for (const q of keys)
      result[String(q.id)] = correct
        ? String(q.option_id)
        : String(
            await scalar(
              "select id from public.options where question_id=$1 and id<>$2 limit 1",
              [q.id, q.option_id],
            ),
          );
    return result;
  };
  await t.test(
    "grading rejects missing questions and cross-quiz options; fail then retake is stored",
    async () => {
      const good = await answers(quizzes[0].id),
        bad = await answers(quizzes[0].id, false);
      const foreign = Object.values(await answers(quizzes[1].id))[0];
      await actor(learner, async () => {
        await expectDenied(() =>
          pg.query("select public.submit_quiz($1,$2,$3,$4)", [
            eid,
            quizzes[0].id,
            {},
            randomUUID(),
          ]),
        );
        const invalid = { ...good, [Object.keys(good)[0]]: foreign };
        await expectDenied(() =>
          pg.query("select public.submit_quiz($1,$2,$3,$4)", [
            eid,
            quizzes[0].id,
            invalid,
            randomUUID(),
          ]),
        );
        const failed = (await scalar(
          "select to_jsonb(public.submit_quiz($1,$2,$3,$4))",
          [eid, quizzes[0].id, bad, randomUUID()],
        )) as { passed: boolean };
        assert.equal(failed.passed, false);
        const rid = randomUUID();
        const a = (await scalar(
          "select to_jsonb(public.submit_quiz($1,$2,$3,$4))",
          [eid, quizzes[0].id, good, rid],
        )) as { id: string; passed: boolean; score: number };
        assert.equal(a.passed, true);
        assert.equal(Number(a.score), 100);
        const retry = (await scalar(
          "select to_jsonb(public.submit_quiz($1,$2,$3,$4))",
          [eid, quizzes[0].id, good, rid],
        )) as { id: string };
        assert.equal(retry.id, a.id);
        await expectDenied(() =>
          pg.query("select public.submit_quiz($1,$2,$3,$4)", [
            eid,
            quizzes[0].id,
            bad,
            rid,
          ]),
        );
        assert.equal(
          await scalar("select count(*)::int from public.certificates"),
          0,
        );
        await expectDenied(() =>
          pg.query("select public.submit_quiz($1,$2,$3,$4)", [
            eid,
            quizzes[1].id,
            good,
            rid,
          ]),
        );
      });
    },
  );
  let code = "";
  await t.test(
    "all distinct required assessments issue exactly one immutable-name certificate",
    async () => {
      const good = await answers(quizzes[1].id);
      await actor(learner, async () => {
        await pg.query("select public.submit_quiz($1,$2,$3,$4)", [
          eid,
          quizzes[1].id,
          good,
          randomUUID(),
        ]);
        await pg.query("select public.submit_quiz($1,$2,$3,$4)", [
          eid,
          quizzes[1].id,
          good,
          randomUUID(),
        ]);
        await pg.query("select public.touch_lesson($1,$2,true)", [
          eid,
          lessons[0].id,
        ]);
        assert.equal(
          await scalar("select count(*)::int from public.certificates"),
          1,
        );
        code = String(
          await scalar("select verification_code from public.certificates"),
        );
        assert.ok(await scalar("select completed_at from public.enrollments"));
        await pg.query("select public.update_profile($1)", ["Changed Name"]);
        assert.equal(
          await scalar("select learner_name from public.certificates"),
          "First Learner",
        );
      });
    },
  );
  await t.test(
    "verification exposes no learner identity and invalid codes return no rows",
    async () =>
      actor(
        null,
        async () => {
          const r = (
            await rows("select * from public.verify_certificate($1)", [code])
          )[0];
          assert.deepEqual(Object.keys(r).sort(), [
            "course_title",
            "issued_at",
            "issuer",
            "valid",
          ]);
          assert.equal(r.valid, true);
          assert.equal(
            (
              await rows("select * from public.verify_certificate($1)", [
                "0".repeat(32),
              ])
            ).length,
            0,
          );
          await expectDenied(() =>
            pg.exec("select * from public.certificates"),
          );
        },
        "anon",
      ),
  );
  await t.test(
    "publishing validates content; editions duplicate atomically; archive preserves learner access",
    async () => {
      let draft = "";
      await actor(admin, async () => {
        draft = String(
          await scalar("select public.admin_lifecycle($1,$2)", [
            course,
            "duplicate",
          ]),
        );
        const d = (await scalar("select public.admin_get_draft($1)", [
          draft,
        ])) as Record<string, unknown>;
        assert.equal(d.status, "draft");
        assert.equal(d.edition, 2);
        const saved = String(
          await scalar("select public.admin_save_draft($1,$2)", [
            { ...d, assessments: [] },
            draft,
          ]),
        );
        assert.equal(saved, draft);
        await expectDenied(() =>
          pg.query("select public.admin_lifecycle($1,$2)", [draft, "publish"]),
        );
        await pg.query("select public.admin_save_draft($1,$2)", [d, draft]);
        await pg.query("select public.admin_lifecycle($1,$2)", [
          draft,
          "publish",
        ]);
        await expectDenied(() =>
          pg.query("select public.admin_save_draft($1,$2)", [d, draft]),
        );
        await pg.query("select public.admin_lifecycle($1,$2)", [
          course,
          "archive",
        ]);
      });
      await actor(
        null,
        async () => {
          assert.equal(
            await scalar(
              "select count(*)::int from public.courses where id=$1",
              [course],
            ),
            0,
          );
        },
        "anon",
      );
      await actor(other, async () => {
        await expectDenied(() =>
          pg.query("select public.enroll($1)", [course]),
        );
      });
      await actor(learner, async () => {
        assert.equal(await scalar("select public.enroll($1)", [course]), eid);
        assert.equal(
          await scalar("select count(*)::int from public.lesson_bodies"),
          lessons.length,
        );
        assert.equal(
          await scalar("select count(*)::int from public.certificates"),
          1,
        );
      });
    },
  );
  await t.test("unrounded pass decisions are used in PostgreSQL", async () => {
    let draft = "";
    await actor(admin, async () => {
      draft = String(
        await scalar("select public.admin_lifecycle($1,$2)", [
          course,
          "duplicate",
        ]),
      );
      const d = (await scalar("select public.admin_get_draft($1)", [
        draft,
      ])) as { assessments: { pass_mark: number; questions: unknown[] }[] };
      d.assessments = d.assessments.slice(0, 1);
      d.assessments[0].pass_mark = 67;
      await pg.query("select public.admin_save_draft($1,$2)", [d, draft]);
      await pg.query("select public.admin_lifecycle($1,$2)", [
        draft,
        "publish",
      ]);
    });
    const aid = await scalar(
      "select id from public.assessments where course_id=$1",
      [draft],
    );
    const good = await answers(aid),
      bad = await answers(aid, false);
    good[Object.keys(good)[0]] = bad[Object.keys(good)[0]];
    const ls = await rows(
      "select l.id from public.lessons l join public.modules m on m.id=l.module_id where m.course_id=$1",
      [draft],
    );
    await actor(learner, async () => {
      const e = await scalar("select public.enroll($1)", [draft]);
      for (const l of ls)
        await pg.query("select public.touch_lesson($1,$2,true)", [e, l.id]);
      const r = (await scalar(
        "select to_jsonb(public.submit_quiz($1,$2,$3,$4))",
        [e, aid, good, randomUUID()],
      )) as { score: number; passed: boolean };
      assert.ok(Number(r.score) > 66 && Number(r.score) < 67);
      assert.equal(r.passed, false);
    });
  });
  await pg.close();
});
