-- PeerPrep initial schema
-- Tables, row-level security, audit triggers and RPCs for privileged actions.
-- Role permissions here mirror src/config/roles.js; keep the two in sync.

-------------------------------------------------------------------------------
-- Types
-------------------------------------------------------------------------------
create type public.app_role as enum ('Student', 'Lecturer', 'StudentAdmin');
create type public.verification_status as enum ('Unverified', 'VerifiedCorrect', 'VerifiedIncorrect');
create type public.difficulty_level as enum ('Easy', 'Medium', 'Hard');

-------------------------------------------------------------------------------
-- Tables
-------------------------------------------------------------------------------
-- Public profile. Email stays in auth.users so it is never exposed to other users.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null check (char_length(first_name) between 1 and 50),
  last_name text not null check (char_length(last_name) between 1 and 50),
  role public.app_role not null default 'Student',
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  code text not null check (char_length(code) between 1 and 20),
  title text not null check (char_length(title) between 1 and 100),
  department text not null check (char_length(department) between 1 and 100),
  created_at timestamptz not null default now()
);
create unique index courses_code_key on public.courses (upper(replace(code, ' ', '')));

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  created_at timestamptz not null default now(),
  unique (id, course_id)
);
create unique index topics_course_name_key on public.topics (course_id, lower(name));

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 10 and 150),
  content text not null check (char_length(btrim(content)) between 20 and 5000),
  course_id uuid not null references public.courses (id) on delete restrict,
  topic_id uuid not null,
  difficulty public.difficulty_level not null,
  author_id uuid default auth.uid() references public.profiles (id) on delete set null,
  attachments jsonb not null default '[]'::jsonb
    check (jsonb_typeof(attachments) = 'array' and jsonb_array_length(attachments) <= 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'C')
  ) stored,
  -- Unstemmed copy so partially typed words ("normaliz") still prefix-match.
  search_simple tsvector generated always as (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(content, ''))) stored,
  -- A question's topic must belong to its course.
  foreign key (topic_id, course_id) references public.topics (id, course_id) on delete restrict
);
create index questions_search_idx on public.questions using gin (search);
create index questions_search_simple_idx on public.questions using gin (search_simple);
create index questions_course_topic_idx on public.questions (course_id, topic_id);
create index questions_author_idx on public.questions (author_id);
create index questions_created_idx on public.questions (created_at desc);

create table public.answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  author_id uuid default auth.uid() references public.profiles (id) on delete set null,
  content text not null check (char_length(btrim(content)) between 10 and 5000),
  attachments jsonb not null default '[]'::jsonb
    check (jsonb_typeof(attachments) = 'array' and jsonb_array_length(attachments) <= 3),
  verification_status public.verification_status not null default 'Unverified',
  verified_by uuid references public.profiles (id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index answers_question_idx on public.answers (question_id, created_at);
create index answers_author_idx on public.answers (author_id);
create index answers_status_idx on public.answers (verification_status, created_at);

-- Append-only history, deliberately not foreign-keyed so it outlives deleted answers.
create table public.verification_records (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('review', 'reset')),
  answer_id uuid not null,
  question_id uuid not null,
  reviewer_id uuid references public.profiles (id) on delete set null,
  status public.verification_status not null,
  previous_status public.verification_status not null,
  is_override boolean not null default false,
  note text not null default '' check (char_length(note) <= 500),
  created_at timestamptz not null default now()
);
create index verification_records_answer_idx on public.verification_records (answer_id, created_at desc);
create index verification_records_created_idx on public.verification_records (created_at desc);

create table public.moderation_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text not null,
  summary text not null,
  reason text not null default '',
  created_at timestamptz not null default now()
);
create index moderation_logs_created_idx on public.moderation_logs (created_at desc);

create table public.access_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  action text not null,
  resource text not null,
  created_at timestamptz not null default now()
);
create index access_logs_created_idx on public.access_logs (created_at desc);

-------------------------------------------------------------------------------
-- Permission helpers (mirror src/config/roles.js)
-------------------------------------------------------------------------------
create function public.has_any_role(roles public.app_role[]) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select p.role = any (roles) from public.profiles p where p.id = auth.uid()), false)
$$;

create function public.can_contribute() returns boolean
language sql stable as $$ select public.has_any_role(array['Student', 'StudentAdmin']::public.app_role[]) $$;

create function public.can_verify() returns boolean
language sql stable as $$ select public.has_any_role(array['Lecturer', 'StudentAdmin']::public.app_role[]) $$;

create function public.is_admin() returns boolean
language sql stable as $$ select public.has_any_role(array['StudentAdmin']::public.app_role[]) $$;

create function public.profile_json(p_id uuid) returns jsonb
language sql stable as $$
  select jsonb_build_object('id', p.id, 'firstName', p.first_name, 'lastName', p.last_name, 'role', p.role)
  from public.profiles p where p.id = p_id
$$;

create function public.display_name(p_id uuid) returns text
language sql stable as $$
  select coalesce((select p.first_name || ' ' || p.last_name from public.profiles p where p.id = p_id), 'Deleted user')
$$;

create function public.role_label(p_role public.app_role) returns text
language sql immutable as $$
  select case p_role when 'StudentAdmin' then 'Student Administrator' else p_role::text end
$$;

create function public.api_error(p_code text, p_message text) returns jsonb
language sql immutable as $$ select jsonb_build_object('error', p_code, 'message', p_message) $$;

-- Records an unauthorized attempt. Callers return an error instead of raising,
-- so the log row is not rolled back.
create function public.record_denied(p_action text, p_resource text) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  insert into public.access_logs (user_id, action, resource) values (auth.uid(), left(p_action, 200), left(p_resource, 200));
  return public.api_error('FORBIDDEN', 'You do not have permission to perform this action.');
end
$$;

-------------------------------------------------------------------------------
-- Triggers
-------------------------------------------------------------------------------
-- Every new account is a Student; client-supplied metadata never sets the role.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, first_name, last_name)
  values (
    new.id,
    left(coalesce(nullif(btrim(new.raw_user_meta_data ->> 'first_name'), ''), nullif(split_part(coalesce(new.email, ''), '@', 1), ''), 'New'), 50),
    left(coalesce(nullif(btrim(new.raw_user_meta_data ->> 'last_name'), ''), 'User'), 50)
  );
  return new;
end
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Attachments must be metadata for files the author uploaded to their own
-- storage folder. Rows written by the service role (seed data) are exempt.
create function public.validate_attachments(p_attachments jsonb, p_owner uuid) returns void
language plpgsql stable as $$
declare
  item jsonb;
begin
  if auth.uid() is null then return; end if;
  for item in select * from jsonb_array_elements(p_attachments) loop
    if jsonb_typeof(item) <> 'object'
       or item ? 'url'
       or coalesce(item ->> 'mimeType', '') not in ('application/pdf', 'image/png', 'image/jpeg')
       or coalesce((item ->> 'size')::bigint, 0) not between 1 and 5242880
       or coalesce(item ->> 'path', '') not like p_owner::text || '/%'
       or char_length(coalesce(item ->> 'fileName', '')) not between 1 and 120 then
      raise exception 'Invalid attachment metadata' using errcode = '22023';
    end if;
  end loop;
end
$$;

create function public.before_question_write() returns trigger
language plpgsql as $$
begin
  perform public.validate_attachments(new.attachments, coalesce(new.author_id, auth.uid()));
  if tg_op = 'UPDATE' then
    new.updated_at := now();
  end if;
  return new;
end
$$;
create trigger questions_before_write before insert or update on public.questions
  for each row execute function public.before_question_write();

-- Editing a verified answer's text resets it to Unverified and records why.
create function public.before_answer_write() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.validate_attachments(new.attachments, coalesce(new.author_id, auth.uid()));
  if tg_op = 'UPDATE' then
    if new.content is distinct from old.content then
      new.updated_at := now();
      if old.verification_status <> 'Unverified' then
        insert into public.verification_records (kind, answer_id, question_id, reviewer_id, status, previous_status, note)
        values ('reset', old.id, old.question_id, null, 'Unverified', old.verification_status,
                'Status reset because the author edited the answer.');
        new.verification_status := 'Unverified';
        new.verified_by := null;
        new.verified_at := null;
      end if;
    elsif new.attachments is distinct from old.attachments then
      new.updated_at := now();
    end if;
  end if;
  return new;
end
$$;
create trigger answers_before_write before insert or update on public.answers
  for each row execute function public.before_answer_write();

-- Category changes made by signed-in administrators are written to the moderation log.
create function public.log_category_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_action text;
  v_id uuid;
  v_summary text;
  v_code text;
begin
  if auth.uid() is null then return null; end if;

  if tg_table_name = 'courses' then
    if tg_op = 'INSERT' then
      v_action := 'CourseCreated'; v_id := new.id; v_summary := new.code || ' ' || new.title;
    elsif tg_op = 'UPDATE' then
      v_action := 'CourseUpdated'; v_id := new.id; v_summary := old.code || ' ' || old.title || ' → ' || new.code || ' ' || new.title;
    else
      v_action := 'CourseDeleted'; v_id := old.id; v_summary := old.code || ' ' || old.title;
    end if;
  else
    if tg_op = 'DELETE' then
      select c.code into v_code from public.courses c where c.id = old.course_id;
      -- Topics removed together with their course are covered by CourseDeleted.
      if v_code is null then return null; end if;
      v_action := 'TopicDeleted'; v_id := old.id; v_summary := v_code || ' › ' || old.name;
    else
      select c.code into v_code from public.courses c where c.id = new.course_id;
      v_id := new.id;
      if tg_op = 'INSERT' then
        v_action := 'TopicCreated'; v_summary := v_code || ' › ' || new.name;
      else
        v_action := 'TopicUpdated'; v_summary := v_code || ' › ' || old.name || ' → ' || new.name;
      end if;
    end if;
  end if;

  insert into public.moderation_logs (actor_id, action, target_type, target_id, summary)
  values (auth.uid(), v_action, case when tg_table_name = 'courses' then 'course' else 'topic' end, v_id::text, v_summary);
  return null;
end
$$;
create trigger courses_audit after insert or update or delete on public.courses
  for each row execute function public.log_category_change();
create trigger topics_audit after insert or update or delete on public.topics
  for each row execute function public.log_category_change();

-------------------------------------------------------------------------------
-- Privileges and row-level security
-------------------------------------------------------------------------------
revoke all on public.profiles, public.courses, public.topics, public.questions, public.answers,
  public.verification_records, public.moderation_logs, public.access_logs from anon, authenticated;

grant select on public.profiles, public.courses, public.topics, public.questions, public.answers,
  public.verification_records to anon, authenticated;
grant select on public.moderation_logs, public.access_logs to authenticated;

grant update (first_name, last_name) on public.profiles to authenticated;
grant insert, update, delete on public.courses, public.topics to authenticated;
grant insert (title, content, course_id, topic_id, difficulty, attachments) on public.questions to authenticated;
grant update (title, content, course_id, topic_id, difficulty, attachments) on public.questions to authenticated;
grant insert (question_id, content, attachments) on public.answers to authenticated;
grant update (content, attachments) on public.answers to authenticated;
-- Question/answer deletion, verification and role changes go through the RPCs below.

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.topics enable row level security;
alter table public.questions enable row level security;
alter table public.answers enable row level security;
alter table public.verification_records enable row level security;
alter table public.moderation_logs enable row level security;
alter table public.access_logs enable row level security;

create policy "Profiles are public" on public.profiles for select using (true);
create policy "Users update their own name" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "Courses are public" on public.courses for select using (true);
create policy "Admins add courses" on public.courses for insert to authenticated with check (public.is_admin());
create policy "Admins edit courses" on public.courses for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins delete courses" on public.courses for delete to authenticated using (public.is_admin());

create policy "Topics are public" on public.topics for select using (true);
create policy "Admins add topics" on public.topics for insert to authenticated with check (public.is_admin());
create policy "Admins edit topics" on public.topics for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins delete topics" on public.topics for delete to authenticated using (public.is_admin());

create policy "Questions are public" on public.questions for select using (true);
create policy "Contributors upload questions" on public.questions for insert to authenticated
  with check (author_id = auth.uid() and public.can_contribute());
create policy "Authors edit their questions" on public.questions for update to authenticated
  using (author_id = auth.uid() and public.can_contribute()) with check (author_id = auth.uid());

create policy "Answers are public" on public.answers for select using (true);
create policy "Contributors post answers" on public.answers for insert to authenticated
  with check (author_id = auth.uid() and public.can_contribute());
create policy "Authors edit their answers" on public.answers for update to authenticated
  using (author_id = auth.uid() and public.can_contribute()) with check (author_id = auth.uid());

create policy "Verification history is public" on public.verification_records for select using (true);
create policy "Admins read moderation logs" on public.moderation_logs for select to authenticated using (public.is_admin());
create policy "Admins read access logs" on public.access_logs for select to authenticated using (public.is_admin());

-------------------------------------------------------------------------------
-- Read models (views run with the caller's permissions)
-------------------------------------------------------------------------------
create view public.question_feed with (security_invoker = true) as
select
  q.id, q.title, q.content, q.course_id, q.topic_id, q.difficulty, q.author_id, q.attachments, q.created_at, q.updated_at,
  jsonb_build_object('id', c.id, 'code', c.code, 'title', c.title, 'department', c.department) as course,
  jsonb_build_object('id', t.id, 'courseId', t.course_id, 'name', t.name) as topic,
  public.profile_json(q.author_id) as author,
  (select count(*) from public.answers a where a.question_id = q.id)::int as answer_count,
  (select count(*) from public.answers a where a.question_id = q.id and a.verification_status = 'VerifiedCorrect')::int as verified_answer_count
from public.questions q
join public.courses c on c.id = q.course_id
join public.topics t on t.id = q.topic_id;

create view public.answer_feed with (security_invoker = true) as
select
  a.id, a.question_id, a.author_id, a.content, a.attachments, a.verification_status, a.verified_by, a.verified_at,
  a.created_at, a.updated_at,
  public.profile_json(a.author_id) as author,
  public.profile_json(a.verified_by) as reviewer,
  coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', v.id, 'kind', v.kind, 'answerId', v.answer_id, 'questionId', v.question_id, 'reviewerId', v.reviewer_id,
      'status', v.status, 'previousStatus', v.previous_status, 'isOverride', v.is_override, 'note', v.note,
      'createdAt', v.created_at, 'reviewer', public.profile_json(v.reviewer_id)
    ) order by v.created_at desc)
    from public.verification_records v where v.answer_id = a.id
  ), '[]'::jsonb) as verification_history,
  q.title as question_title,
  q.course_id,
  jsonb_build_object(
    'id', q.id, 'title', q.title,
    'course', jsonb_build_object('id', c.id, 'code', c.code, 'title', c.title, 'department', c.department),
    'topic', jsonb_build_object('id', t.id, 'courseId', t.course_id, 'name', t.name)
  ) as question
from public.answers a
join public.questions q on q.id = a.question_id
join public.courses c on c.id = q.course_id
join public.topics t on t.id = q.topic_id;

create view public.course_catalog with (security_invoker = true) as
select
  c.id, c.code, c.title, c.department, c.created_at,
  (select count(*) from public.questions q where q.course_id = c.id)::int as question_count,
  coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', t.id, 'courseId', t.course_id, 'name', t.name, 'createdAt', t.created_at,
      'questionCount', (select count(*) from public.questions q where q.topic_id = t.id)
    ) order by t.name)
    from public.topics t where t.course_id = c.id
  ), '[]'::jsonb) as topics
from public.courses c;

create view public.verification_activity with (security_invoker = true) as
select
  v.id, v.kind, v.answer_id, v.question_id, v.reviewer_id, v.status, v.previous_status, v.is_override, v.note, v.created_at,
  public.profile_json(v.reviewer_id) as reviewer,
  case when q.id is null then null else jsonb_build_object(
    'id', q.id, 'title', q.title,
    'course', jsonb_build_object('id', c.id, 'code', c.code, 'title', c.title),
    'topic', jsonb_build_object('id', t.id, 'name', t.name)
  ) end as question,
  exists (select 1 from public.answers a where a.id = v.answer_id) as answer_exists
from public.verification_records v
left join public.questions q on q.id = v.question_id
left join public.courses c on c.id = q.course_id
left join public.topics t on t.id = q.topic_id;

create view public.moderation_log_feed with (security_invoker = true) as
select l.*, public.profile_json(l.actor_id) as actor from public.moderation_logs l;

create view public.access_log_feed with (security_invoker = true) as
select l.*, public.profile_json(l.user_id) as "user" from public.access_logs l;

revoke all on public.question_feed, public.answer_feed, public.course_catalog, public.verification_activity,
  public.moderation_log_feed, public.access_log_feed from anon, authenticated;
grant select on public.question_feed, public.answer_feed, public.course_catalog, public.verification_activity to anon, authenticated;
grant select on public.moderation_log_feed, public.access_log_feed to authenticated;

-------------------------------------------------------------------------------
-- Search
-------------------------------------------------------------------------------
-- Keyword search over question text, course/topic names and answers. Every term
-- must match, either as a stemmed English word or as an unstemmed prefix.
create function public.question_matches(p_q text, p_course_id uuid, p_topic_id uuid, p_difficulty public.difficulty_level)
returns table (id uuid, created_at timestamptz, rank real)
language plpgsql stable set search_path = public as $$
#variable_conflict use_column
declare
  v_stop text[] := array['a', 'an', 'and', 'the', 'of', 'to', 'in', 'on', 'for', 'is', 'how', 'what', 'why', 'with', 'by', 'from', 'do', 'does'];
  v_terms text[];
  v_english tsquery;
  v_simple tsquery;
begin
  select array_agg(term) into v_terms
  from regexp_split_to_table(lower(regexp_replace(coalesce(p_q, ''), '[^[:alnum:]]+', ' ', 'g')), '\s+') as term
  where char_length(term) > 1 and term <> all (v_stop);

  if v_terms is not null then
    v_english := to_tsquery('english', array_to_string(v_terms, ' & '));
    v_simple := to_tsquery('simple', array_to_string(array(select t || ':*' from unnest(v_terms) t), ' & '));
    if numnode(v_english) = 0 then v_english := null; end if;
  end if;

  return query
  select q.id, q.created_at,
    case when v_simple is null then 0::real
      else ts_rank(q.search || setweight(to_tsvector('english', c.code || ' ' || c.title || ' ' || t.name), 'B'), coalesce(v_english, v_simple))
         + ts_rank(q.search_simple || to_tsvector('simple', c.code || ' ' || c.title || ' ' || t.name), v_simple) end
  from public.questions q
  join public.courses c on c.id = q.course_id
  join public.topics t on t.id = q.topic_id
  where (p_course_id is null or q.course_id = p_course_id)
    and (p_topic_id is null or q.topic_id = p_topic_id)
    and (p_difficulty is null or q.difficulty = p_difficulty)
    and (
      v_simple is null
      or (v_english is not null and (q.search || to_tsvector('english', c.code || ' ' || c.title || ' ' || t.name)) @@ v_english)
      or (q.search_simple || to_tsvector('simple', c.code || ' ' || c.title || ' ' || t.name)) @@ v_simple
      or exists (
        select 1 from public.answers a
        where a.question_id = q.id
          and ((v_english is not null and to_tsvector('english', a.content) @@ v_english) or to_tsvector('simple', a.content) @@ v_simple)
      )
    );
end
$$;

create function public.search_questions(
  p_q text default '',
  p_course_id uuid default null,
  p_topic_id uuid default null,
  p_difficulty public.difficulty_level default null,
  p_sort text default 'recent',
  p_page int default 1,
  p_page_size int default 8
) returns jsonb
language plpgsql stable set search_path = public as $$
declare
  v_size int := least(greatest(coalesce(p_page_size, 8), 1), 50);
  v_total int;
  v_pages int;
  v_page int;
  v_ids jsonb;
begin
  select count(*) into v_total from public.question_matches(p_q, p_course_id, p_topic_id, p_difficulty);
  v_pages := greatest(1, ceil(v_total::numeric / v_size)::int);
  v_page := least(greatest(coalesce(p_page, 1), 1), v_pages);

  select coalesce(jsonb_agg(s.id order by s.n), '[]'::jsonb) into v_ids
  from (
    select m.id, row_number() over (
      order by case when p_sort = 'relevance' then m.rank else 0 end desc, m.created_at desc
    ) as n
    from public.question_matches(p_q, p_course_id, p_topic_id, p_difficulty) m
  ) s
  where s.n > (v_page - 1) * v_size and s.n <= v_page * v_size;

  return jsonb_build_object('ids', v_ids, 'total', v_total, 'page', v_page, 'pageSize', v_size, 'totalPages', v_pages);
end
$$;

-------------------------------------------------------------------------------
-- Privileged actions (return {ok} or {error, message})
-------------------------------------------------------------------------------
create function public.attachment_paths(p_attachments jsonb) returns jsonb
language sql immutable as $$
  select coalesce(jsonb_agg(item -> 'path'), '[]'::jsonb)
  from jsonb_array_elements(p_attachments) item where item ? 'path'
$$;

-- Authors delete their own question; StudentAdmins delete any (logged with a reason).
create function public.delete_question(p_id uuid, p_reason text default '') returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_q public.questions;
  v_paths jsonb;
begin
  if auth.uid() is null then return public.api_error('UNAUTHENTICATED', 'Your session has ended. Please sign in again.'); end if;
  select * into v_q from public.questions where id = p_id;
  if not found then return public.api_error('NOT_FOUND', 'This question could not be found. It may have been removed.'); end if;

  if not (v_q.author_id = auth.uid() and public.can_contribute()) then
    if not public.is_admin() then
      return public.record_denied('question:delete', format('Delete question "%s"', v_q.title));
    end if;
    insert into public.moderation_logs (actor_id, action, target_type, target_id, summary, reason)
    values (auth.uid(), 'QuestionDeleted', 'question', v_q.id::text,
            format('"%s" by %s', v_q.title, public.display_name(v_q.author_id)), left(btrim(coalesce(p_reason, '')), 300));
  end if;

  select public.attachment_paths(v_q.attachments) ||
         coalesce((select jsonb_agg(p.value) from public.answers a, jsonb_array_elements(public.attachment_paths(a.attachments)) p where a.question_id = p_id), '[]'::jsonb)
    into v_paths;
  delete from public.questions where id = p_id;
  return jsonb_build_object('ok', true, 'paths', v_paths);
end
$$;

create function public.delete_answer(p_id uuid, p_reason text default '') returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_a public.answers;
begin
  if auth.uid() is null then return public.api_error('UNAUTHENTICATED', 'Your session has ended. Please sign in again.'); end if;
  select * into v_a from public.answers where id = p_id;
  if not found then return public.api_error('NOT_FOUND', 'This answer could not be found. It may have been removed.'); end if;

  if not (v_a.author_id = auth.uid() and public.can_contribute()) then
    if not public.is_admin() then
      return public.record_denied('answer:delete', 'Delete answer ' || v_a.id);
    end if;
    insert into public.moderation_logs (actor_id, action, target_type, target_id, summary, reason)
    values (auth.uid(), 'AnswerDeleted', 'answer', v_a.id::text,
            format('"%s…" by %s', left(regexp_replace(v_a.content, '\s+', ' ', 'g'), 60), public.display_name(v_a.author_id)),
            left(btrim(coalesce(p_reason, '')), 300));
  end if;

  delete from public.answers where id = p_id;
  return jsonb_build_object('ok', true, 'paths', public.attachment_paths(v_a.attachments));
end
$$;

-- Lecturers and StudentAdmins verify answers. Changing a decision is an override
-- and needs explicit confirmation. Nobody verifies their own answer.
create function public.verify_answer(p_answer_id uuid, p_status public.verification_status, p_note text default '', p_confirm_override boolean default false)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_a public.answers;
  v_override boolean;
begin
  if auth.uid() is null then return public.api_error('UNAUTHENTICATED', 'Your session has ended. Please sign in again.'); end if;
  if not public.can_verify() then return public.record_denied('answer:verify', 'Verify answer ' || p_answer_id); end if;

  select * into v_a from public.answers where id = p_answer_id for update;
  if not found then return public.api_error('NOT_FOUND', 'This answer could not be found. It may have been removed.'); end if;
  if p_status is null or p_status = 'Unverified' then return public.api_error('VALIDATION', 'Choose Correct or Incorrect.'); end if;
  if v_a.author_id = auth.uid() then
    perform public.record_denied('answer:verify-own', 'Answer ' || v_a.id);
    return public.api_error('FORBIDDEN', 'You cannot verify your own answer.');
  end if;
  if v_a.verification_status = p_status then return public.api_error('CONFLICT', 'This answer already has that verification status.'); end if;

  v_override := v_a.verification_status <> 'Unverified';
  if v_override and not coalesce(p_confirm_override, false) then
    return public.api_error('CONFLICT', 'Overriding an existing decision requires confirmation.');
  end if;

  insert into public.verification_records (kind, answer_id, question_id, reviewer_id, status, previous_status, is_override, note)
  values ('review', v_a.id, v_a.question_id, auth.uid(), p_status, v_a.verification_status, v_override, left(btrim(coalesce(p_note, '')), 500));
  update public.answers set verification_status = p_status, verified_by = auth.uid(), verified_at = now() where id = v_a.id;
  return jsonb_build_object('ok', true);
end
$$;

create function public.admin_overview() returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_since timestamptz := now() - interval '7 days';
begin
  if auth.uid() is null then return public.api_error('UNAUTHENTICATED', 'Your session has ended. Please sign in again.'); end if;
  if not public.is_admin() then return public.record_denied('admin:overview', 'Administration overview'); end if;
  return jsonb_build_object('ok', true, 'overview', jsonb_build_object(
    'users', (select count(*) from public.profiles),
    'questions', (select count(*) from public.questions),
    'answers', (select count(*) from public.answers),
    'pendingVerification', (select count(*) from public.answers where verification_status = 'Unverified'),
    'newContentThisWeek', (select count(*) from public.questions where created_at >= v_since) + (select count(*) from public.answers where created_at >= v_since),
    'accessDeniedThisWeek', (select count(*) from public.access_logs where created_at >= v_since)
  ));
end
$$;

-- Includes email addresses, so it is restricted to StudentAdmins.
create function public.admin_list_users(p_q text default '', p_role public.app_role default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_q text := '%' || lower(btrim(coalesce(p_q, ''))) || '%';
begin
  if auth.uid() is null then return public.api_error('UNAUTHENTICATED', 'Your session has ended. Please sign in again.'); end if;
  if not public.is_admin() then return public.record_denied('role:manage', 'User management'); end if;
  return jsonb_build_object('ok', true, 'users', coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', p.id, 'firstName', p.first_name, 'lastName', p.last_name, 'email', u.email, 'role', p.role,
      'isDemo', p.is_demo, 'createdAt', p.created_at
    ) order by p.last_name, p.first_name)
    from public.profiles p join auth.users u on u.id = p.id
    where (p_role is null or p.role = p_role)
      and lower(p.first_name || ' ' || p.last_name || ' ' || coalesce(u.email, '')) like v_q
  ), '[]'::jsonb));
end
$$;

create function public.admin_change_role(p_user_id uuid, p_role public.app_role, p_reason text default '') returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_target public.profiles;
begin
  if auth.uid() is null then return public.api_error('UNAUTHENTICATED', 'Your session has ended. Please sign in again.'); end if;
  if not public.is_admin() then return public.record_denied('role:manage', 'Change role of user ' || p_user_id); end if;

  select * into v_target from public.profiles where id = p_user_id for update;
  if not found then return public.api_error('NOT_FOUND', 'This user could not be found.'); end if;
  if v_target.id = auth.uid() then return public.api_error('CONFLICT', 'You cannot change your own role. Ask another administrator.'); end if;
  if v_target.is_demo then return public.api_error('CONFLICT', 'Demo account roles are fixed so each role can always be tested.'); end if;
  if v_target.role = p_role then return public.api_error('CONFLICT', 'This user already has that role.'); end if;

  insert into public.moderation_logs (actor_id, action, target_type, target_id, summary, reason)
  values (auth.uid(), 'RoleChanged', 'user', v_target.id::text,
          format('%s %s: %s → %s', v_target.first_name, v_target.last_name, public.role_label(v_target.role), public.role_label(p_role)), left(btrim(coalesce(p_reason, '')), 300));
  update public.profiles set role = p_role where id = v_target.id;
  return jsonb_build_object('ok', true);
end
$$;

-- Lets route guards record blocked page visits.
create function public.log_access_denied(p_resource text, p_action text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return; end if;
  insert into public.access_logs (user_id, action, resource) values (auth.uid(), left(coalesce(p_action, ''), 200), left(coalesce(p_resource, ''), 200));
end
$$;

-- Internal helpers are not callable through the API.
revoke execute on function public.record_denied(text, text) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.log_category_change() from public, anon, authenticated;
revoke execute on function public.before_answer_write() from public, anon, authenticated;
revoke execute on function public.before_question_write() from public, anon, authenticated;
revoke execute on function public.delete_question(uuid, text), public.delete_answer(uuid, text),
  public.verify_answer(uuid, public.verification_status, text, boolean), public.admin_overview(),
  public.admin_list_users(text, public.app_role), public.admin_change_role(uuid, public.app_role, text),
  public.log_access_denied(text, text) from public, anon;
grant execute on function public.delete_question(uuid, text), public.delete_answer(uuid, text),
  public.verify_answer(uuid, public.verification_status, text, boolean), public.admin_overview(),
  public.admin_list_users(text, public.app_role), public.admin_change_role(uuid, public.app_role, text),
  public.log_access_denied(text, text) to authenticated;

-------------------------------------------------------------------------------
-- Attachment storage
-------------------------------------------------------------------------------
-- Past paper material is meant to be shared, so files are publicly readable.
-- Uploads go to <user id>/<file> and are limited to PDF, PNG and JPEG up to 5 MB.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('attachments', 'attachments', true, 5242880, array['application/pdf', 'image/png', 'image/jpeg'])
on conflict (id) do update
  set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "Contributors upload to their own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text and public.can_contribute());
create policy "Owners and admins delete attachments" on storage.objects for delete to authenticated
  using (bucket_id = 'attachments' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
