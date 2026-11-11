-- Nijo Learn: all trusted writes pass through checked transactional functions.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to anon, authenticated;

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check (length(btrim(display_name)) between 2 and 80),
 created_at timestamptz not null default now()
);
create table private.admin_members (user_id uuid primary key references auth.users(id) on delete cascade, created_at timestamptz not null default now());
create table public.categories (id uuid primary key default gen_random_uuid(), name text not null unique check(length(btrim(name)) between 2 and 80), slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'));
create table public.courses (
 id uuid primary key default gen_random_uuid(), category_id uuid not null references public.categories(id),
 title text not null check(length(btrim(title)) between 3 and 140), slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 summary text not null default '', outcomes jsonb not null default '[]' check(jsonb_typeof(outcomes)='array'),
 course_type text not null default 'Certificate' check(course_type in ('Certificate','Diploma')),
 duration_minutes integer not null default 60 check(duration_minutes between 5 and 60000),
 status text not null default 'draft' check(status in ('draft','published','archived')),
 edition integer not null default 1 check(edition>0), source_course_id uuid references public.courses(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.modules (
 id uuid primary key default gen_random_uuid(), course_id uuid not null references public.courses(id) on delete cascade,
 title text not null check(length(btrim(title)) between 2 and 140), position integer not null check(position>=0), unique(course_id,position), unique(id,course_id)
);
create table public.lessons (
 id uuid primary key default gen_random_uuid(), module_id uuid not null references public.modules(id) on delete cascade,
 title text not null check(length(btrim(title)) between 2 and 140), position integer not null check(position>=0), required boolean not null default true,
 duration_minutes integer not null default 10 check(duration_minutes between 1 and 6000), unique(module_id,position)
);
create table public.lesson_bodies (lesson_id uuid primary key references public.lessons(id) on delete cascade, markdown text not null default '', video_url text check(video_url is null or video_url ~ '^https://www[.]youtube-nocookie[.]com/embed/[a-zA-Z0-9_-]{11}$'));
create table public.assessments (
 id uuid primary key default gen_random_uuid(), course_id uuid not null references public.courses(id) on delete cascade,
 module_id uuid, title text not null check(length(btrim(title)) between 2 and 140), position integer not null check(position>=0),
 required boolean not null default true, pass_mark integer not null default 70 check(pass_mark between 1 and 100),
 foreign key(module_id,course_id) references public.modules(id,course_id) on delete cascade,
 unique(course_id,position)
);
create table public.questions (id uuid primary key default gen_random_uuid(), assessment_id uuid not null references public.assessments(id) on delete cascade, prompt text not null check(length(btrim(prompt)) between 3 and 1000), position integer not null check(position>=0), unique(assessment_id,position));
create table public.options (id uuid primary key default gen_random_uuid(), question_id uuid not null references public.questions(id) on delete cascade, label text not null check(length(btrim(label)) between 1 and 500), position integer not null check(position>=0), unique(question_id,position), unique(id,question_id));
create table private.answer_keys (question_id uuid primary key references public.questions(id) on delete cascade, option_id uuid not null, foreign key(option_id,question_id) references public.options(id,question_id) on delete cascade);
create table public.enrollments (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
 course_id uuid not null references public.courses(id), last_lesson_id uuid references public.lessons(id),
 enrolled_at timestamptz not null default now(), completed_at timestamptz, unique(user_id,course_id)
);
create table public.lesson_progress (enrollment_id uuid not null references public.enrollments(id) on delete cascade, lesson_id uuid not null references public.lessons(id), completed_at timestamptz not null default now(), primary key(enrollment_id,lesson_id));
create table public.attempts (
 id uuid primary key default gen_random_uuid(), enrollment_id uuid not null references public.enrollments(id) on delete cascade,
 assessment_id uuid not null references public.assessments(id), request_id uuid not null, submission_hash text not null, score numeric not null check(score between 0 and 100), passed boolean not null,
 submitted_at timestamptz not null default now(), unique(enrollment_id,request_id)
);
create table public.certificates (
 id uuid primary key default gen_random_uuid(), enrollment_id uuid not null unique references public.enrollments(id),
 verification_code text not null unique default replace(gen_random_uuid()::text,'-',''),
 learner_name text not null, course_title text not null, issuer text not null default 'Nijo Learn', issued_at timestamptz not null default now()
);
create index courses_catalog on public.courses(status,category_id,course_type);
create index modules_course on public.modules(course_id);
create index lessons_module on public.lessons(module_id);
create index assessments_module on public.assessments(module_id);
create index assessments_course on public.assessments(course_id);
create index questions_assessment on public.questions(assessment_id);
create index options_question on public.options(question_id);
create index enrollments_course on public.enrollments(course_id);
create index progress_lesson on public.lesson_progress(lesson_id);
create index attempts_best on public.attempts(enrollment_id,assessment_id,score desc);
create index attempts_assessment on public.attempts(assessment_id);

create function private.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from private.admin_members where user_id=auth.uid()); $$;
create function public.is_admin() returns boolean language sql stable set search_path='' as $$ select private.is_admin(); $$;
create function private.has_enrollment(p_course uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.enrollments where course_id=p_course and user_id=auth.uid()); $$;
create function private.can_read_course(p_course uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.is_admin() or private.has_enrollment(p_course) or exists(select 1 from public.courses where id=p_course and status='published'); $$;
create function private.can_study(p_course uuid) returns boolean language sql stable security definer set search_path='' as $$ select private.is_admin() or private.has_enrollment(p_course); $$;
create function private.owns_enrollment(p_id uuid) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.enrollments where id=p_id and user_id=auth.uid()); $$;
create function private.new_profile() returns trigger language plpgsql security definer set search_path='' as $$
 begin insert into public.profiles(id,display_name) values(new.id, left(case when length(btrim(coalesce(new.raw_user_meta_data->>'display_name','')))>=2 then btrim(new.raw_user_meta_data->>'display_name') else 'Learner' end,80)); return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.new_profile();

-- Explicit grants: there are no client INSERT/UPDATE/DELETE rights.
do $$ declare t text; begin
 foreach t in array array['profiles','categories','courses','modules','lessons','lesson_bodies','assessments','questions','options','enrollments','lesson_progress','attempts','certificates'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon, authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 end loop;
end $$;
alter table private.admin_members enable row level security;
alter table private.answer_keys enable row level security;
grant select on public.categories, public.courses, public.modules, public.lessons, public.assessments to anon;
create policy profile_owner on public.profiles for select to authenticated using(id=(select auth.uid()));
create policy categories_read on public.categories for select to anon,authenticated using(true);
create policy courses_read on public.courses for select to anon,authenticated using(private.can_read_course(id));
create policy modules_read on public.modules for select to anon,authenticated using(private.can_read_course(course_id));
create policy lessons_outline on public.lessons for select to anon,authenticated using(exists(select 1 from public.modules m where m.id=module_id and private.can_read_course(m.course_id)));
create policy bodies_study on public.lesson_bodies for select to authenticated using(exists(select 1 from public.lessons l join public.modules m on m.id=l.module_id where l.id=lesson_id and private.can_study(m.course_id)));
create policy assessment_outline on public.assessments for select to anon,authenticated using(private.can_read_course(course_id));
create policy questions_study on public.questions for select to authenticated using(exists(select 1 from public.assessments a where a.id=assessment_id and private.can_study(a.course_id)));
create policy options_study on public.options for select to authenticated using(exists(select 1 from public.questions q join public.assessments a on a.id=q.assessment_id where q.id=question_id and private.can_study(a.course_id)));
create policy enrollment_owner on public.enrollments for select to authenticated using(user_id=(select auth.uid()) or private.is_admin());
create policy progress_owner on public.lesson_progress for select to authenticated using(private.owns_enrollment(enrollment_id));
create policy attempts_owner on public.attempts for select to authenticated using(private.owns_enrollment(enrollment_id));
create policy certificates_owner on public.certificates for select to authenticated using(private.owns_enrollment(enrollment_id));

-- Published content cannot be revised even by a privileged accidental write.
create function private.guard_course() returns trigger language plpgsql set search_path='' as $$ begin
 if old.status <> 'draft' then
  if tg_op='DELETE' then raise exception 'Published editions cannot be deleted'; end if;
  if (to_jsonb(new)-'status'-'updated_at') is distinct from (to_jsonb(old)-'status'-'updated_at') or not (new.status=old.status or (old.status='published' and new.status='archived')) then raise exception 'Duplicate this edition to revise its content'; end if;
 elsif tg_op='UPDATE' and new.status='archived' then raise exception 'Only published editions can be archived';
 end if;
 if tg_op='DELETE' then return old; end if; return new;
end; $$;
create trigger course_immutable before update or delete on public.courses for each row execute function private.guard_course();
create function private.guard_content() returns trigger language plpgsql set search_path='' as $$
 declare row_data jsonb; cid uuid; begin
 for row_data in select case when tg_op='DELETE' then to_jsonb(old) else to_jsonb(new) end union all select to_jsonb(old) where tg_op='UPDATE' loop
 case tg_table_name
 when 'modules' then cid:=(row_data->>'course_id')::uuid;
 when 'lessons' then select course_id into cid from public.modules where id=(row_data->>'module_id')::uuid;
 when 'lesson_bodies' then select m.course_id into cid from public.lessons l join public.modules m on m.id=l.module_id where l.id=(row_data->>'lesson_id')::uuid;
 when 'assessments' then cid:=(row_data->>'course_id')::uuid;
 when 'questions' then select course_id into cid from public.assessments where id=(row_data->>'assessment_id')::uuid;
 when 'options' then select a.course_id into cid from public.questions q join public.assessments a on a.id=q.assessment_id where q.id=(row_data->>'question_id')::uuid;
 when 'answer_keys' then select a.course_id into cid from public.questions q join public.assessments a on a.id=q.assessment_id where q.id=(row_data->>'question_id')::uuid;
 end case;
 if exists(select 1 from public.courses where id=cid and status<>'draft') then raise exception 'Published content is immutable'; end if;
 end loop;
 if tg_op='DELETE' then return old; end if; return new;
end; $$;
do $$ declare t text; begin foreach t in array array['modules','lessons','lesson_bodies','assessments','questions','options'] loop execute format('create trigger content_immutable before insert or update or delete on public.%I for each row execute function private.guard_content()',t); end loop; end $$;
create trigger answers_immutable before insert or update or delete on private.answer_keys for each row execute function private.guard_content();

create function private.require_actor() returns uuid language plpgsql stable security definer set search_path='' as $$ declare uid uuid:=auth.uid(); begin
 if uid is null or not exists(select 1 from auth.users where id=uid and email_confirmed_at is not null) then raise exception 'A verified account is required' using errcode='42501'; end if; return uid; end; $$;
create function private.complete_enrollment(p_enrollment uuid) returns void language plpgsql security definer set search_path='' as $$
 declare e public.enrollments; begin
 select * into strict e from public.enrollments where id=p_enrollment for update;
 if exists(select 1 from public.lessons l join public.modules m on m.id=l.module_id where m.course_id=e.course_id and l.required and not exists(select 1 from public.lesson_progress p where p.enrollment_id=e.id and p.lesson_id=l.id)) then return; end if;
 if exists(select 1 from public.assessments a where a.course_id=e.course_id and a.required and not exists(select 1 from public.attempts t where t.enrollment_id=e.id and t.assessment_id=a.id and t.passed)) then return; end if;
 -- Published courses always have required work; defensively reject empty courses.
 if not exists(select 1 from public.assessments where course_id=e.course_id and required) or not exists(select 1 from public.lessons l join public.modules m on m.id=l.module_id where m.course_id=e.course_id and l.required) then return; end if;
 update public.enrollments set completed_at=coalesce(completed_at,now()) where id=e.id;
 insert into public.certificates(enrollment_id,learner_name,course_title,issued_at)
 select e.id,p.display_name,c.title,coalesce(e.completed_at,now()) from public.profiles p,public.courses c where p.id=e.user_id and c.id=e.course_id on conflict(enrollment_id) do nothing;
end; $$;
create function private.enroll(p_course uuid) returns uuid language plpgsql security definer set search_path='' as $$
 declare uid uuid:=private.require_actor(); eid uuid; begin
 perform 1 from public.courses where id=p_course for share;
 select id into eid from public.enrollments where user_id=uid and course_id=p_course;
 if eid is not null then return eid; end if;
 if not exists(select 1 from public.courses where id=p_course and status='published') then raise exception 'This course is not accepting enrollments'; end if;
 insert into public.enrollments(user_id,course_id) values(uid,p_course) on conflict(user_id,course_id) do update set user_id=excluded.user_id returning id into eid; return eid;
end; $$;
create function public.enroll(p_course uuid) returns uuid language sql set search_path='' as $$ select private.enroll(p_course); $$;
create function private.touch_lesson(p_enrollment uuid,p_lesson uuid,p_complete boolean) returns void language plpgsql security definer set search_path='' as $$
 declare uid uuid:=private.require_actor(); e public.enrollments; begin
 select * into e from public.enrollments where id=p_enrollment and user_id=uid for update;
 if e.id is null or not exists(select 1 from public.lessons l join public.modules m on m.id=l.module_id where l.id=p_lesson and m.course_id=e.course_id) then raise exception 'Lesson access denied' using errcode='42501'; end if;
 update public.enrollments set last_lesson_id=p_lesson where id=e.id;
 if p_complete then insert into public.lesson_progress(enrollment_id,lesson_id) values(e.id,p_lesson) on conflict do nothing; perform private.complete_enrollment(e.id); end if;
end; $$;
create function public.touch_lesson(p_enrollment uuid,p_lesson uuid,p_complete boolean default false) returns void language sql set search_path='' as $$ select private.touch_lesson(p_enrollment,p_lesson,p_complete); $$;
create function private.quiz_unlocked(p_enrollment uuid,p_assessment uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.enrollments e join public.assessments a on a.course_id=e.course_id where e.id=p_enrollment and e.user_id=auth.uid()
 and not exists(select 1 from public.lessons l join public.modules m on m.id=l.module_id where m.course_id=e.course_id and (a.module_id is null or m.id=a.module_id) and l.required and not exists(select 1 from public.lesson_progress p where p.enrollment_id=e.id and p.lesson_id=l.id)) and a.id=p_assessment); $$;
create function public.quiz_unlocked(p_enrollment uuid,p_assessment uuid) returns boolean language sql stable set search_path='' as $$ select private.quiz_unlocked(p_enrollment,p_assessment); $$;
create function private.submit_quiz(p_enrollment uuid,p_assessment uuid,p_answers jsonb,p_request uuid) returns public.attempts language plpgsql security definer set search_path='' as $$
 declare uid uuid:=private.require_actor(); e public.enrollments; a public.assessments; t public.attempts; total integer; correct integer; begin
 select * into e from public.enrollments where id=p_enrollment and user_id=uid for update;
 if e.id is null then raise exception 'Enrollment access denied' using errcode='42501'; end if;
 select * into a from public.assessments where id=p_assessment and course_id=e.course_id;
 if a.id is null then raise exception 'Assessment does not belong to this enrollment'; end if;
 select * into t from public.attempts where enrollment_id=e.id and request_id=p_request;
 if t.id is not null then if t.assessment_id<>a.id or t.submission_hash is distinct from md5(p_answers::text) then raise exception 'Request identifier reused for a different submission'; end if; return t; end if;
 if p_request is null or not private.quiz_unlocked(e.id,a.id) then raise exception 'Complete the required lessons before taking this assessment'; end if;
 if jsonb_typeof(p_answers) is distinct from 'object' then raise exception 'Submit one answer for every question'; end if;
 select count(*) into total from public.questions where assessment_id=a.id;
 if total=0 or (select count(*) from jsonb_object_keys(p_answers))<>total then raise exception 'Submit one answer for every question'; end if;
 if exists(select 1 from public.questions q where q.assessment_id=a.id and not exists(select 1 from public.options o where o.question_id=q.id and o.id::text=p_answers->>q.id::text)) then raise exception 'Invalid question or answer option'; end if;
 select count(*) into correct from public.questions q join private.answer_keys k on k.question_id=q.id where q.assessment_id=a.id and k.option_id::text=p_answers->>q.id::text;
 insert into public.attempts(enrollment_id,assessment_id,request_id,submission_hash,score,passed) values(e.id,a.id,p_request,md5(p_answers::text),correct*100.0/total,correct*100>=a.pass_mark*total) returning * into t;
 perform private.complete_enrollment(e.id); return t;
end; $$;
create function public.submit_quiz(p_enrollment uuid,p_assessment uuid,p_answers jsonb,p_request uuid) returns jsonb language sql set search_path='' as $$ select to_jsonb(private.submit_quiz(p_enrollment,p_assessment,p_answers,p_request)) - 'submission_hash'; $$;
create function private.update_profile(p_name text) returns void language plpgsql security definer set search_path='' as $$ declare uid uuid:=private.require_actor(); begin update public.profiles set display_name=btrim(p_name) where id=uid; end; $$;
create function public.update_profile(p_name text) returns void language sql set search_path='' as $$ select private.update_profile(p_name); $$;
create function private.verify_certificate(p_code text) returns table(valid boolean,course_title text,issuer text,issued_at timestamptz) language sql stable security definer set search_path='' as $$ select true,c.course_title,c.issuer,c.issued_at from public.certificates c where c.verification_code=p_code and length(p_code)=32; $$;
create function public.verify_certificate(p_code text) returns table(valid boolean,course_title text,issuer text,issued_at timestamptz) language sql stable set search_path='' as $$ select * from private.verify_certificate(p_code); $$;

-- Admin editor accepts a complete draft, and replaces its ordered content atomically.
-- The internal store is intentionally not callable by application roles.
create function private.store_draft(p_data jsonb,p_id uuid default null) returns uuid language plpgsql security definer set search_path='' as $$
 declare cid uuid; mid uuid; lid uuid; aid uuid; qid uuid; oid uuid; m jsonb; l jsonb; a jsonb; q jsonb; o jsonb; mi int:=0; li int; ai int:=0; qi int; oi int; correct_index int; begin
 if jsonb_typeof(p_data) is distinct from 'object' or octet_length(p_data::text)>1000000 then raise exception 'Invalid or oversized course'; end if;
 if p_id is null then insert into public.courses(category_id,title,slug,summary,outcomes,course_type,duration_minutes,edition,source_course_id)
 values((p_data->>'category_id')::uuid,p_data->>'title',p_data->>'slug',coalesce(p_data->>'summary',''),coalesce(p_data->'outcomes','[]'),coalesce(p_data->>'course_type','Certificate'),coalesce((p_data->>'duration_minutes')::int,60),coalesce((p_data->>'edition')::int,1),(p_data->>'source_course_id')::uuid) returning id into cid;
 else
 select id into cid from public.courses where id=p_id and status='draft' for update;
 if cid is null then raise exception 'Only drafts can be edited'; end if;
 update public.courses set category_id=(p_data->>'category_id')::uuid,title=p_data->>'title',slug=p_data->>'slug',summary=coalesce(p_data->>'summary',''),outcomes=coalesce(p_data->'outcomes','[]'),course_type=coalesce(p_data->>'course_type','Certificate'),duration_minutes=coalesce((p_data->>'duration_minutes')::int,60),updated_at=now() where id=cid;
 delete from public.assessments where course_id=cid;
 delete from public.modules where course_id=cid;
 end if;
 for m in select value from jsonb_array_elements(coalesce(p_data->'modules','[]')) loop
 insert into public.modules(course_id,title,position) values(cid,m->>'title',mi) returning id into mid; li:=0;
 for l in select value from jsonb_array_elements(coalesce(m->'lessons','[]')) loop
 insert into public.lessons(module_id,title,position,required,duration_minutes) values(mid,l->>'title',li,coalesce((l->>'required')::boolean,true),coalesce((l->>'duration_minutes')::int,10)) returning id into lid;
 insert into public.lesson_bodies(lesson_id,markdown,video_url) values(lid,coalesce(l->>'markdown',''),nullif(l->>'video_url','')); li:=li+1;
 end loop; mi:=mi+1; end loop;
 for a in select value from jsonb_array_elements(coalesce(p_data->'assessments','[]')) loop
 mid:=null;
 if a->>'module_position' is not null then select id into mid from public.modules where course_id=cid and position=(a->>'module_position')::int; if mid is null then raise exception 'Invalid assessment module'; end if; end if;
 insert into public.assessments(course_id,module_id,title,position,required,pass_mark) values(cid,mid,a->>'title',ai,coalesce((a->>'required')::boolean,true),coalesce((a->>'pass_mark')::int,70)) returning id into aid; qi:=0;
 for q in select value from jsonb_array_elements(coalesce(a->'questions','[]')) loop
 insert into public.questions(assessment_id,prompt,position) values(aid,q->>'prompt',qi) returning id into qid; oi:=0; correct_index:=(q->>'correct_index')::int;
 for o in select value from jsonb_array_elements(coalesce(q->'options','[]')) loop
 insert into public.options(question_id,label,position) values(qid,o#>>'{}',oi) returning id into oid;
 if oi=correct_index then insert into private.answer_keys(question_id,option_id) values(qid,oid); end if; oi:=oi+1;
 end loop;
 if correct_index is not null and (correct_index<0 or correct_index>=oi) then raise exception 'Invalid correct answer index'; end if;
 qi:=qi+1; end loop; ai:=ai+1; end loop; return cid;
end; $$;
create function private.admin_save_draft(p_data jsonb,p_id uuid default null) returns uuid language plpgsql security definer set search_path='' as $$ begin perform private.require_actor(); if not private.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if; return private.store_draft(p_data,p_id); end; $$;
create function public.admin_save_draft(p_data jsonb,p_id uuid default null) returns uuid language sql set search_path='' as $$ select private.admin_save_draft(p_data,p_id); $$;
create function private.admin_get_draft(p_id uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$ declare result jsonb; begin
 perform private.require_actor(); if not private.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
 select to_jsonb(c)||jsonb_build_object('modules',coalesce((select jsonb_agg(to_jsonb(m)||jsonb_build_object('lessons',coalesce((select jsonb_agg(to_jsonb(l)||jsonb_build_object('markdown',b.markdown,'video_url',b.video_url) order by l.position) from public.lessons l join public.lesson_bodies b on b.lesson_id=l.id where l.module_id=m.id),'[]'::jsonb)) order by m.position) from public.modules m where m.course_id=c.id),'[]'::jsonb),
 'assessments',coalesce((select jsonb_agg(to_jsonb(a)||jsonb_build_object('module_position',(select position from public.modules where id=a.module_id),'questions',coalesce((select jsonb_agg(to_jsonb(q)||jsonb_build_object('options',(select jsonb_agg(o.label order by o.position) from public.options o where o.question_id=q.id),'correct_index',(select o.position from private.answer_keys k join public.options o on o.id=k.option_id where k.question_id=q.id)) order by q.position) from public.questions q where q.assessment_id=a.id),'[]'::jsonb)) order by a.position) from public.assessments a where a.course_id=c.id),'[]'::jsonb)) into result from public.courses c where c.id=p_id;
 return result;
end; $$;
create function public.admin_get_draft(p_id uuid) returns jsonb language sql stable set search_path='' as $$ select private.admin_get_draft(p_id); $$;
create function private.validate_publish(p_id uuid) returns void language plpgsql set search_path='' as $$ begin
 if not exists(select 1 from public.courses c where c.id=p_id and length(btrim(c.summary))>=30 and jsonb_array_length(c.outcomes)>0 and not exists(select 1 from jsonb_array_elements(c.outcomes) o where jsonb_typeof(o)<>'string' or length(btrim(o#>>'{}'))<3)) then raise exception 'Add a summary of at least 30 characters and usable learning outcomes'; end if;
 if not exists(select 1 from public.lessons l join public.modules m on m.id=l.module_id where m.course_id=p_id and l.required) then raise exception 'Add at least one required lesson'; end if;
 if exists(select 1 from public.lessons l join public.modules m on m.id=l.module_id left join public.lesson_bodies b on b.lesson_id=l.id where m.course_id=p_id and (b.markdown is null or length(btrim(b.markdown))<40)) then raise exception 'Every lesson needs at least 40 characters of text content'; end if;
 if not exists(select 1 from public.assessments where course_id=p_id and required) then raise exception 'Add at least one required assessment'; end if;
 if exists(select 1 from public.assessments a where a.course_id=p_id and not exists(select 1 from public.questions q where q.assessment_id=a.id)) then raise exception 'Each assessment needs questions'; end if;
 if exists(select 1 from public.questions q join public.assessments a on a.id=q.assessment_id where a.course_id=p_id and ((select count(*) from public.options o where o.question_id=q.id)<2 or not exists(select 1 from private.answer_keys k where k.question_id=q.id))) then raise exception 'Each question needs two options and exactly one correct answer'; end if;
 if exists(select 1 from public.modules m where m.course_id=p_id and not exists(select 1 from public.lessons l where l.module_id=m.id)) then raise exception 'Each module needs a lesson'; end if;
end; $$;
create function private.admin_lifecycle(p_id uuid,p_action text) returns uuid language plpgsql security definer set search_path='' as $$
 declare c public.courses; data jsonb; cid uuid; begin
 perform private.require_actor(); if not private.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
 select * into strict c from public.courses where id=p_id for update;
 if p_action='publish' and c.status='draft' then perform private.validate_publish(c.id); update public.courses set status='published',updated_at=now() where id=c.id; return c.id;
 elsif p_action='archive' and c.status='published' then update public.courses set status='archived',updated_at=now() where id=c.id; return c.id;
 elsif p_action='duplicate' and c.status in ('published','archived') then
 data:=private.admin_get_draft(c.id)||jsonb_build_object('slug',c.slug||'-e'||(c.edition+1)::text||'-'||left(replace(gen_random_uuid()::text,'-',''),6),'edition',c.edition+1,'source_course_id',c.id);
 cid:=private.store_draft(data,null); return cid;
 else raise exception 'This lifecycle action is unavailable'; end if;
end; $$;
create function public.admin_lifecycle(p_id uuid,p_action text) returns uuid language sql set search_path='' as $$ select private.admin_lifecycle(p_id,p_action); $$;
create function private.admin_category(p_id uuid,p_name text,p_slug text) returns uuid language plpgsql security definer set search_path='' as $$ declare cid uuid; begin
 perform private.require_actor(); if not private.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
 if p_id is null then insert into public.categories(name,slug) values(btrim(p_name),p_slug) returning id into cid; else update public.categories set name=btrim(p_name),slug=p_slug where id=p_id returning id into cid; if cid is null then raise exception 'Category not found'; end if; end if; return cid;
end; $$;
create function public.admin_category(p_id uuid,p_name text,p_slug text) returns uuid language sql set search_path='' as $$ select private.admin_category(p_id,p_name,p_slug); $$;

-- All functions start closed; expose only the listed actor-checked RPC boundary.
revoke all on all functions in schema private from public, anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;
grant execute on function private.is_admin(), public.is_admin(), private.can_read_course(uuid),private.has_enrollment(uuid),private.can_study(uuid),private.owns_enrollment(uuid) to anon,authenticated;
grant execute on function private.verify_certificate(text),public.verify_certificate(text) to anon,authenticated;
grant execute on function private.enroll(uuid),public.enroll(uuid),private.touch_lesson(uuid,uuid,boolean),public.touch_lesson(uuid,uuid,boolean),private.quiz_unlocked(uuid,uuid),public.quiz_unlocked(uuid,uuid),private.submit_quiz(uuid,uuid,jsonb,uuid),public.submit_quiz(uuid,uuid,jsonb,uuid),private.update_profile(text),public.update_profile(text),private.admin_save_draft(jsonb,uuid),public.admin_save_draft(jsonb,uuid),private.admin_get_draft(uuid),public.admin_get_draft(uuid),private.admin_lifecycle(uuid,text),public.admin_lifecycle(uuid,text),private.admin_category(uuid,text,text),public.admin_category(uuid,text,text) to authenticated;
-- Supabase development bootstrap uses service_role; browsers never receive that key.
grant all on private.admin_members to service_role;
grant usage on schema private to service_role;

-- Development bootstrap is callable only with the privileged service role key.
create function private.dev_set_admin(p_user uuid) returns void language plpgsql security definer set search_path='' as $$ begin
 if current_setting('request.jwt.claim.role',true) is distinct from 'service_role' and coalesce(current_setting('request.jwt.claims',true),'{}')::jsonb->>'role' is distinct from 'service_role' then raise exception 'Service role required' using errcode='42501'; end if;
 insert into private.admin_members(user_id) values(p_user) on conflict do nothing;
end; $$;
create function public.dev_set_admin(p_user uuid) returns void language sql set search_path='' as $$ select private.dev_set_admin(p_user); $$;
revoke all on function private.dev_set_admin(uuid),public.dev_set_admin(uuid) from public,anon,authenticated;
grant execute on function private.dev_set_admin(uuid),public.dev_set_admin(uuid) to service_role;
