-- =============================================================================
-- GANJALOKA — social core (phase 1)
-- profiles · posts (posts, replies, reposts) · likes · follows · blocks · reports
--
-- Security model
--   * RLS is enabled on every table; members can only write their own rows.
--   * Counters, moderation fields and roles are written by triggers and
--     security-definer functions only. Column grants keep members out of them.
--   * Helpers live in the unexposed `private` schema with search_path = ''.
--   * Errors meant for the app are raised as stable codes ('GL_*').
-- =============================================================================

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

create table public.profiles (
  id              uuid primary key
                  references auth.users (id) on delete cascade
                  deferrable initially deferred,
  username        text not null,
  display_name    text not null,
  bio             text not null default '',
  avatar_path     text,
  role            text not null default 'member',
  suspended_at    timestamptz,
  followers_count integer not null default 0,
  following_count integer not null default 0,
  posts_count     integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[a-z0-9_]{3,20}$'),
  constraint profiles_display_name_length
    check (char_length(btrim(display_name)) between 1 and 50),
  constraint profiles_bio_length check (char_length(bio) <= 160),
  constraint profiles_role check (role in ('member', 'moderator', 'admin')),
  constraint profiles_avatar_in_own_folder
    check (avatar_path is null or avatar_path like id::text || '/%')
);
create unique index profiles_username_key on public.profiles (username);

-- Age + terms attestation. Kept out of the API and out of JWTs on purpose.
create table private.member_attestations (
  user_id       uuid primary key
                references auth.users (id) on delete cascade
                deferrable initially deferred,
  birth_date    date not null,
  terms_version text not null,
  accepted_at   timestamptz not null default now()
);

create table public.posts (
  id           uuid primary key default gen_random_uuid(),
  author_id    uuid not null references public.profiles (id) on delete cascade,
  -- 'post' | 'reply' | 'repost' — fixed at insert, survives parent deletion.
  kind         text not null default 'post',
  body         text not null default '',
  -- [{ "path": "<uid>/<uuid>.webp", "w": 1600, "h": 1200, "alt": "..." }]
  media        jsonb not null default '[]'::jsonb,
  reply_to_id  uuid references public.posts (id) on delete set null,
  repost_of_id uuid references public.posts (id) on delete cascade,
  like_count   integer not null default 0,
  reply_count  integer not null default 0,
  repost_count integer not null default 0,
  removed_at   timestamptz,
  created_at   timestamptz not null default now(),
  constraint posts_kind check (kind in ('post', 'reply', 'repost')),
  constraint posts_body_length check (char_length(body) <= 500),
  constraint posts_media_shape
    check (jsonb_typeof(media) = 'array' and jsonb_array_length(media) <= 4),
  constraint posts_repost_shape check (
    kind <> 'repost'
    or (body = '' and media = '[]'::jsonb and reply_to_id is null)
  ),
  constraint posts_has_content check (
    kind = 'repost'
    or char_length(btrim(body)) > 0
    or jsonb_array_length(media) > 0
  )
);
create index posts_author_timeline_idx
  on public.posts (author_id, created_at desc, id desc);
create index posts_explore_idx
  on public.posts (created_at desc, id desc)
  where kind <> 'reply' and removed_at is null;
create index posts_replies_idx
  on public.posts (reply_to_id, created_at, id) where reply_to_id is not null;
create index posts_repost_of_idx
  on public.posts (repost_of_id) where repost_of_id is not null;
create unique index posts_one_repost_per_member
  on public.posts (author_id, repost_of_id) where repost_of_id is not null;

create table public.likes (
  member_id  uuid not null references public.profiles (id) on delete cascade,
  post_id    uuid not null references public.posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (member_id, post_id)
);
create index likes_post_idx on public.likes (post_id);

create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  followee_id uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followee_id),
  constraint follows_not_self check (follower_id <> followee_id)
);
create index follows_followee_idx on public.follows (followee_id, follower_id);

create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint blocks_not_self check (blocker_id <> blocked_id)
);
create index blocks_blocked_idx on public.blocks (blocked_id, blocker_id);

create table public.reports (
  id              uuid primary key default gen_random_uuid(),
  reporter_id     uuid not null references public.profiles (id) on delete cascade,
  target_type     text not null,
  -- Targets go NULL if deleted; the snapshot keeps the evidence.
  post_id         uuid references public.posts (id) on delete set null,
  profile_id      uuid references public.profiles (id) on delete set null,
  target_snapshot jsonb not null default '{}'::jsonb,
  reason          text not null,
  details         text not null default '',
  status          text not null default 'open',
  resolution      text,
  resolved_by     uuid references public.profiles (id) on delete set null,
  resolved_at     timestamptz,
  created_at      timestamptz not null default now(),
  constraint reports_target_type check (target_type in ('post', 'profile')),
  constraint reports_reason check (reason in (
    'sale', 'harassment', 'hate', 'sexual', 'minor_safety',
    'violence', 'spam', 'impersonation', 'other'
  )),
  constraint reports_details_length check (char_length(details) <= 500),
  constraint reports_status check (status in ('open', 'actioned', 'dismissed'))
);
create index reports_queue_idx on public.reports (created_at) where status = 'open';
create unique index reports_one_open_per_target
  on public.reports (reporter_id, target_type, coalesce(post_id, profile_id))
  where status = 'open';
create index reports_post_idx on public.reports (post_id) where post_id is not null;
create index reports_profile_idx on public.reports (profile_id) where profile_id is not null;

-- -----------------------------------------------------------------------------
-- Helpers (private, security definer, fixed search_path)
-- -----------------------------------------------------------------------------

create function private.is_reserved_username(p_username text)
returns boolean
language sql immutable
set search_path = ''
as $$
  select p_username = any (array[
    'admin', 'administrator', 'ganjaloka', 'moderator', 'mod', 'mods',
    'official', 'staff', 'support', 'help', 'security', 'team', 'root',
    'system', 'settings', 'api', 'null', 'undefined'
  ]);
$$;

create function private.is_blocked_pair(a uuid, b uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select a is not null and b is not null and exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b)
       or (blocker_id = b and blocked_id = a)
  );
$$;

create function private.is_moderator()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role in ('moderator', 'admin')
  );
$$;

create function private.assert_active_member(p_member uuid)
returns void
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.profiles where id = p_member and suspended_at is not null
  ) then
    raise exception 'GL_SUSPENDED';
  end if;
end;
$$;


-- -----------------------------------------------------------------------------
-- Sign-up: validate 21+, terms, username; create profile; strip birth date
-- from user metadata so it never rides along in a JWT.
-- -----------------------------------------------------------------------------

create function private.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  meta       jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_username text  := lower(btrim(coalesce(meta ->> 'username', '')));
  v_display  text  := btrim(coalesce(meta ->> 'display_name', ''));
  v_terms    text  := btrim(coalesce(meta ->> 'terms_version', ''));
  v_birth    date;
begin
  begin
    v_birth := (meta ->> 'birth_date')::date;
  exception when others then
    raise exception 'GL_INVALID_BIRTH_DATE';
  end;

  if v_birth is null then
    raise exception 'GL_INVALID_BIRTH_DATE';
  end if;
  -- 21st birthday on or before today.
  if v_birth > (current_date - interval '21 years')::date then
    raise exception 'GL_UNDER_21';
  end if;
  if v_terms = '' then
    raise exception 'GL_TERMS_REQUIRED';
  end if;
  if v_username !~ '^[a-z0-9_]{3,20}$' or private.is_reserved_username(v_username) then
    raise exception 'GL_INVALID_USERNAME';
  end if;
  if exists (select 1 from public.profiles where username = v_username) then
    raise exception 'GL_USERNAME_TAKEN';
  end if;
  if v_display = '' then
    v_display := v_username;
  end if;

  insert into public.profiles (id, username, display_name)
  values (new.id, v_username, left(v_display, 50));

  insert into private.member_attestations (user_id, birth_date, terms_version)
  values (new.id, v_birth, v_terms);

  new.raw_user_meta_data := (meta - 'birth_date' - 'terms_version')
    || jsonb_build_object('age_verified', true);
  return new;
end;
$$;

create trigger on_auth_user_created
  before insert on auth.users
  for each row execute function private.handle_new_user();

-- GoTrue rewrites user metadata from memory after insert (and members can
-- call updateUser), so strip the attestation keys on every update too.
create function private.scrub_user_metadata()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if new.raw_user_meta_data ?| array['birth_date', 'terms_version'] then
    new.raw_user_meta_data := new.raw_user_meta_data - 'birth_date' - 'terms_version';
  end if;
  return new;
end;
$$;

create trigger on_auth_user_updated
  before update of raw_user_meta_data on auth.users
  for each row execute function private.scrub_user_metadata();

-- -----------------------------------------------------------------------------
-- Profiles
-- -----------------------------------------------------------------------------

create function private.touch_profile()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch
  before update on public.profiles
  for each row execute function private.touch_profile();

-- -----------------------------------------------------------------------------
-- Posts: shape, ownership, rate limit, blocks; then counters
-- -----------------------------------------------------------------------------

create function private.before_post_insert()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_target public.posts;
  v_item   jsonb;
begin
  perform private.assert_active_member(new.author_id);

  -- Server-owned columns: never trust the client.
  new.created_at   := now();
  new.like_count   := 0;
  new.reply_count  := 0;
  new.repost_count := 0;
  new.removed_at   := null;

  if (
    select count(*) from public.posts
    where author_id = new.author_id and created_at > now() - interval '1 minute'
  ) >= 8 then
    raise exception 'GL_RATE_LIMITED';
  end if;

  if new.repost_of_id is not null then
    select * into v_target from public.posts where id = new.repost_of_id;
    if not found or v_target.removed_at is not null then
      raise exception 'GL_POST_UNAVAILABLE';
    end if;
    -- Reposting a repost points at the original.
    if v_target.kind = 'repost' then
      new.repost_of_id := v_target.repost_of_id;
      select * into v_target from public.posts where id = new.repost_of_id;
      if not found or v_target.removed_at is not null then
        raise exception 'GL_POST_UNAVAILABLE';
      end if;
    end if;
    if private.is_blocked_pair(new.author_id, v_target.author_id) then
      raise exception 'GL_BLOCKED';
    end if;
    new.kind := 'repost';
    new.reply_to_id := null;
    new.body := '';
    new.media := '[]'::jsonb;
  elsif new.reply_to_id is not null then
    select * into v_target from public.posts where id = new.reply_to_id;
    if not found or v_target.removed_at is not null or v_target.kind = 'repost' then
      raise exception 'GL_POST_UNAVAILABLE';
    end if;
    if private.is_blocked_pair(new.author_id, v_target.author_id) then
      raise exception 'GL_BLOCKED';
    end if;
    new.kind := 'reply';
  else
    new.kind := 'post';
  end if;

  -- Media must be well-formed and live in the author's own storage folder.
  if jsonb_typeof(new.media) <> 'array' then
    raise exception 'GL_INVALID_MEDIA';
  end if;
  -- `is distinct from` / coalesce so a missing key fails closed (NULL ≠ pass).
  for v_item in select * from jsonb_array_elements(new.media) loop
    if jsonb_typeof(v_item) is distinct from 'object'
       or jsonb_typeof(v_item -> 'path') is distinct from 'string'
       or jsonb_typeof(v_item -> 'w') is distinct from 'number'
       or jsonb_typeof(v_item -> 'h') is distinct from 'number'
       or (v_item -> 'alt' is not null and jsonb_typeof(v_item -> 'alt') <> 'string') then
      raise exception 'GL_INVALID_MEDIA';
    end if;
    if not coalesce(
         (v_item ->> 'path') ~ ('^' || new.author_id::text || '/[0-9a-f-]{36}\.(webp|jpg|png)$')
         and (v_item ->> 'w')::numeric between 1 and 8192
         and (v_item ->> 'h')::numeric between 1 and 8192
         and char_length(coalesce(v_item ->> 'alt', '')) <= 300,
         false
       ) then
      raise exception 'GL_INVALID_MEDIA';
    end if;
  end loop;

  return new;
end;
$$;

create trigger posts_before_insert
  before insert on public.posts
  for each row execute function private.before_post_insert();

create function private.after_post_change()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_delta integer := case when tg_op = 'INSERT' then 1 else -1 end;
  v_row   public.posts := case when tg_op = 'INSERT' then new else old end;
begin
  if v_row.kind <> 'repost' then
    update public.profiles
      set posts_count = greatest(posts_count + v_delta, 0)
      where id = v_row.author_id;
  end if;
  if v_row.kind = 'reply' and v_row.reply_to_id is not null then
    update public.posts
      set reply_count = greatest(reply_count + v_delta, 0)
      where id = v_row.reply_to_id;
  end if;
  if v_row.kind = 'repost' and v_row.repost_of_id is not null then
    update public.posts
      set repost_count = greatest(repost_count + v_delta, 0)
      where id = v_row.repost_of_id;
  end if;
  return null;
end;
$$;

create trigger posts_after_insert
  after insert on public.posts
  for each row execute function private.after_post_change();
create trigger posts_after_delete
  after delete on public.posts
  for each row execute function private.after_post_change();

-- -----------------------------------------------------------------------------
-- Likes
-- -----------------------------------------------------------------------------

create function private.before_like_insert()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_post public.posts;
begin
  perform private.assert_active_member(new.member_id);
  new.created_at := now();
  select * into v_post from public.posts where id = new.post_id;
  if not found or v_post.removed_at is not null or v_post.kind = 'repost' then
    raise exception 'GL_POST_UNAVAILABLE';
  end if;
  if private.is_blocked_pair(new.member_id, v_post.author_id) then
    raise exception 'GL_BLOCKED';
  end if;
  return new;
end;
$$;

create trigger likes_before_insert
  before insert on public.likes
  for each row execute function private.before_like_insert();

create function private.after_like_change()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set like_count = like_count + 1 where id = new.post_id;
  else
    update public.posts set like_count = greatest(like_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;

create trigger likes_after_insert
  after insert on public.likes
  for each row execute function private.after_like_change();
create trigger likes_after_delete
  after delete on public.likes
  for each row execute function private.after_like_change();

-- -----------------------------------------------------------------------------
-- Follows
-- -----------------------------------------------------------------------------

create function private.before_follow_insert()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  perform private.assert_active_member(new.follower_id);
  new.created_at := now();
  if private.is_blocked_pair(new.follower_id, new.followee_id) then
    raise exception 'GL_BLOCKED';
  end if;
  return new;
end;
$$;

create trigger follows_before_insert
  before insert on public.follows
  for each row execute function private.before_follow_insert();

create function private.after_follow_change()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_delta integer := case when tg_op = 'INSERT' then 1 else -1 end;
  v_row   public.follows := case when tg_op = 'INSERT' then new else old end;
begin
  update public.profiles
    set following_count = greatest(following_count + v_delta, 0)
    where id = v_row.follower_id;
  update public.profiles
    set followers_count = greatest(followers_count + v_delta, 0)
    where id = v_row.followee_id;
  return null;
end;
$$;

create trigger follows_after_insert
  after insert on public.follows
  for each row execute function private.after_follow_change();
create trigger follows_after_delete
  after delete on public.follows
  for each row execute function private.after_follow_change();

-- -----------------------------------------------------------------------------
-- Blocks: blocking cuts follows in both directions.
-- -----------------------------------------------------------------------------

create function private.after_block_insert()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  delete from public.follows
  where (follower_id = new.blocker_id and followee_id = new.blocked_id)
     or (follower_id = new.blocked_id and followee_id = new.blocker_id);
  return null;
end;
$$;

create trigger blocks_after_insert
  after insert on public.blocks
  for each row execute function private.after_block_insert();

-- -----------------------------------------------------------------------------
-- Reports: snapshot the target as evidence, rate-limit reporters.
-- -----------------------------------------------------------------------------

create function private.before_report_insert()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_post    public.posts;
  v_profile public.profiles;
begin
  new.status := 'open';
  new.resolution := null;
  new.resolved_by := null;
  new.resolved_at := null;
  new.created_at := now();

  if (
    select count(*) from public.reports
    where reporter_id = new.reporter_id and created_at > now() - interval '1 hour'
  ) >= 20 then
    raise exception 'GL_RATE_LIMITED';
  end if;

  if new.target_type = 'post' then
    select * into v_post from public.posts where id = new.post_id;
    if not found then
      raise exception 'GL_POST_UNAVAILABLE';
    end if;
    new.profile_id := null;
    new.target_snapshot := jsonb_build_object(
      'author_id', v_post.author_id,
      'body', v_post.body,
      'media', v_post.media,
      'created_at', v_post.created_at
    );
  elsif new.target_type = 'profile' then
    select * into v_profile from public.profiles where id = new.profile_id;
    if not found then
      raise exception 'GL_PROFILE_UNAVAILABLE';
    end if;
    new.post_id := null;
    new.target_snapshot := jsonb_build_object(
      'username', v_profile.username,
      'display_name', v_profile.display_name,
      'bio', v_profile.bio,
      'avatar_path', v_profile.avatar_path
    );
  end if;
  return new;
end;
$$;

create trigger reports_before_insert
  before insert on public.reports
  for each row execute function private.before_report_insert();

-- -----------------------------------------------------------------------------
-- Moderation RPC (the only write path for report resolution and suspensions)
-- -----------------------------------------------------------------------------

create function public.moderate_report(
  p_report_id uuid,
  p_action text,
  p_note text default null
)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_report public.reports;
  v_author uuid;
begin
  if not private.is_moderator() then
    raise exception 'GL_FORBIDDEN';
  end if;
  if p_action not in ('dismiss', 'remove_post', 'suspend_member', 'remove_and_suspend') then
    raise exception 'GL_INVALID_ACTION';
  end if;

  select * into v_report from public.reports where id = p_report_id for update;
  if not found then
    raise exception 'GL_NOT_FOUND';
  end if;

  v_author := coalesce(
    v_report.profile_id,
    (v_report.target_snapshot ->> 'author_id')::uuid
  );

  if p_action in ('remove_post', 'remove_and_suspend') then
    if v_report.post_id is null then
      raise exception 'GL_INVALID_ACTION';
    end if;
    update public.posts set removed_at = now() where id = v_report.post_id;
  end if;

  if p_action in ('suspend_member', 'remove_and_suspend') then
    if v_author is null then
      raise exception 'GL_INVALID_ACTION';
    end if;
    if v_author = (select auth.uid()) then
      raise exception 'GL_INVALID_ACTION';
    end if;
    update public.profiles set suspended_at = now()
      where id = v_author and role = 'member';
  end if;

  -- Resolve this report and any other open reports on the same target.
  update public.reports
    set status = case when p_action = 'dismiss' then 'dismissed' else 'actioned' end,
        resolution = left(coalesce(p_note, p_action), 500),
        resolved_by = (select auth.uid()),
        resolved_at = now()
    where status = 'open'
      and (
        id = v_report.id
        or (v_report.post_id is not null and post_id = v_report.post_id)
        or (v_report.profile_id is not null and profile_id = v_report.profile_id)
      );
end;
$$;

revoke execute on function public.moderate_report(uuid, text, text) from public, anon;
grant execute on function public.moderate_report(uuid, text, text) to authenticated;

-- -----------------------------------------------------------------------------
-- Feed RPCs — security invoker, so RLS (removed posts, blocks) applies.
-- Keyset pagination on (created_at, id), newest first.
-- -----------------------------------------------------------------------------

create function public.home_feed(
  p_before_at timestamptz default null,
  p_before_id uuid default null,
  p_limit integer default 20
)
returns setof public.posts
language sql stable
set search_path = ''
as $$
  select p.*
  from public.posts p
  where p.kind <> 'reply'
    and (
      p.author_id = (select auth.uid())
      or p.author_id in (
        select f.followee_id from public.follows f
        where f.follower_id = (select auth.uid())
      )
    )
    and (
      p_before_at is null
      or (p.created_at, p.id) < (p_before_at, coalesce(p_before_id, 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid))
    )
  order by p.created_at desc, p.id desc
  limit least(greatest(coalesce(p_limit, 20), 1), 50);
$$;

create function public.explore_feed(
  p_before_at timestamptz default null,
  p_before_id uuid default null,
  p_limit integer default 20
)
returns setof public.posts
language sql stable
set search_path = ''
as $$
  select p.*
  from public.posts p
  where p.kind <> 'reply'
    and p.removed_at is null
    and (
      p_before_at is null
      or (p.created_at, p.id) < (p_before_at, coalesce(p_before_id, 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid))
    )
  order by p.created_at desc, p.id desc
  limit least(greatest(coalesce(p_limit, 20), 1), 50);
$$;

create function public.profile_feed(
  p_profile_id uuid,
  p_before_at timestamptz default null,
  p_before_id uuid default null,
  p_limit integer default 20
)
returns setof public.posts
language sql stable
set search_path = ''
as $$
  select p.*
  from public.posts p
  where p.author_id = p_profile_id
    and p.kind <> 'reply'
    and (
      p_before_at is null
      or (p.created_at, p.id) < (p_before_at, coalesce(p_before_id, 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid))
    )
  order by p.created_at desc, p.id desc
  limit least(greatest(coalesce(p_limit, 20), 1), 50);
$$;

-- Replies read oldest-first, so the cursor moves forward.
create function public.thread_replies(
  p_post_id uuid,
  p_after_at timestamptz default null,
  p_after_id uuid default null,
  p_limit integer default 30
)
returns setof public.posts
language sql stable
set search_path = ''
as $$
  select p.*
  from public.posts p
  where p.reply_to_id = p_post_id
    and (
      p_after_at is null
      or (p.created_at, p.id) > (p_after_at, coalesce(p_after_id, '00000000-0000-0000-0000-000000000000'::uuid))
    )
  order by p.created_at asc, p.id asc
  limit least(greatest(coalesce(p_limit, 30), 1), 50);
$$;

-- -----------------------------------------------------------------------------
-- Row-level security
-- -----------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.posts    enable row level security;
alter table public.likes    enable row level security;
alter table public.follows  enable row level security;
alter table public.blocks   enable row level security;
alter table public.reports  enable row level security;
alter table private.member_attestations enable row level security;

-- profiles
create policy "profiles are public"
  on public.profiles for select to anon, authenticated
  using (true);
create policy "members edit their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- posts
create policy "posts are visible unless removed or blocked"
  on public.posts for select to anon, authenticated
  using (
    (
      removed_at is null
      or author_id = (select auth.uid())
      or (select private.is_moderator())
    )
    and not private.is_blocked_pair((select auth.uid()), author_id)
  );
create policy "members create their own posts"
  on public.posts for insert to authenticated
  with check (author_id = (select auth.uid()));
create policy "members delete their own posts"
  on public.posts for delete to authenticated
  using (author_id = (select auth.uid()));

-- likes
create policy "likes are public"
  on public.likes for select to anon, authenticated
  using (true);
create policy "members like as themselves"
  on public.likes for insert to authenticated
  with check (member_id = (select auth.uid()));
create policy "members unlike as themselves"
  on public.likes for delete to authenticated
  using (member_id = (select auth.uid()));

-- follows
create policy "follows are public"
  on public.follows for select to anon, authenticated
  using (true);
create policy "members follow as themselves"
  on public.follows for insert to authenticated
  with check (follower_id = (select auth.uid()));
create policy "members unfollow as themselves"
  on public.follows for delete to authenticated
  using (follower_id = (select auth.uid()));

-- blocks: private to the blocker
create policy "members see their own blocks"
  on public.blocks for select to authenticated
  using (blocker_id = (select auth.uid()));
create policy "members block as themselves"
  on public.blocks for insert to authenticated
  with check (blocker_id = (select auth.uid()));
create policy "members unblock as themselves"
  on public.blocks for delete to authenticated
  using (blocker_id = (select auth.uid()));

-- reports: reporters see their own; moderators see all
create policy "reporters and moderators read reports"
  on public.reports for select to authenticated
  using (reporter_id = (select auth.uid()) or (select private.is_moderator()));
create policy "members file reports as themselves"
  on public.reports for insert to authenticated
  with check (reporter_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- Column-level privileges: members can only touch the columns they own.
-- -----------------------------------------------------------------------------

revoke insert, update, delete, truncate on public.profiles from anon, authenticated;
grant update (display_name, bio, avatar_path) on public.profiles to authenticated;

revoke insert, update, delete, truncate on public.posts from anon, authenticated;
grant insert (author_id, body, media, reply_to_id, repost_of_id) on public.posts to authenticated;
grant delete on public.posts to authenticated;

revoke insert, update, delete, truncate on public.likes from anon, authenticated;
grant insert (member_id, post_id), delete on public.likes to authenticated;

revoke insert, update, delete, truncate on public.follows from anon, authenticated;
grant insert (follower_id, followee_id), delete on public.follows to authenticated;

revoke insert, update, delete, truncate on public.blocks from anon, authenticated;
grant insert (blocker_id, blocked_id), delete on public.blocks to authenticated;

revoke insert, update, delete, truncate on public.reports from anon, authenticated;
grant insert (reporter_id, target_type, post_id, profile_id, reason, details)
  on public.reports to authenticated;

revoke all on private.member_attestations from anon, authenticated;

-- -----------------------------------------------------------------------------
-- Storage: public buckets, members write only inside "<their uid>/".
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152, array['image/webp', 'image/jpeg', 'image/png']),
  ('post-media', 'post-media', true, 6291456, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy "members read their own media objects"
  on storage.objects for select to authenticated
  using (
    bucket_id in ('avatars', 'post-media')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "members upload into their own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id in ('avatars', 'post-media')
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and not exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and suspended_at is not null
    )
  );
create policy "members replace their own media objects"
  on storage.objects for update to authenticated
  using (
    bucket_id in ('avatars', 'post-media')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "members delete their own media objects"
  on storage.objects for delete to authenticated
  using (
    bucket_id in ('avatars', 'post-media')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- -----------------------------------------------------------------------------
-- Function privileges (last, so it covers every function above).
-- Functions are executable by PUBLIC by default; RLS needs only these two.
-- -----------------------------------------------------------------------------

revoke execute on all functions in schema private from public;
grant execute on function private.is_blocked_pair(uuid, uuid) to anon, authenticated;
grant execute on function private.is_moderator() to anon, authenticated;
