-- ManifestYOU for Humans: people, their morning readings, evening check-ins.
-- Only the service key (Netlify functions) touches these tables: RLS on, no policies.

create table if not exists public.humans (
  id               uuid primary key default gen_random_uuid(),
  email            text not null unique,
  token_version    integer not null default 1,   -- bump to revoke every link
  link_sent_at     timestamptz,
  status           text not null default 'pending' check (status in ('pending','active','paused')),
  tz               text not null default 'America/Costa_Rica',
  send_hour        smallint not null default 6 check (send_hour between 0 and 23),
  sign             text,
  profile          jsonb not null default '{}'::jsonb,
  -- voice (built now, switched on later with VOICE_ENABLED)
  voice_status     text not null default 'none' check (voice_status in ('none','sample','ready','failed')),
  voice_provider   text,
  voice_id         text,
  voice_sample_path text,
  voice_consent_at timestamptz,
  created_at       timestamptz not null default now(),
  confirmed_at     timestamptz
);

create table if not exists public.human_readings (
  id          bigserial primary key,
  human_id    uuid not null references public.humans(id) on delete cascade,
  day         date not null,
  text        text not null,
  model       text,
  audio_path  text,
  created_at  timestamptz not null default now(),
  emailed_at  timestamptz,
  opened_at   timestamptz,
  unique (human_id, day)
);

create table if not exists public.human_checkins (
  id          bigserial primary key,
  human_id    uuid not null references public.humans(id) on delete cascade,
  day         date not null,
  text        text not null,
  created_at  timestamptz not null default now(),
  unique (human_id, day)
);

create index if not exists humans_active_hour on public.humans (status, send_hour);

alter table public.humans enable row level security;
alter table public.human_readings enable row level security;
alter table public.human_checkins enable row level security;

-- private bucket for voice samples and spoken readings
insert into storage.buckets (id, name, public) values ('human-voice', 'human-voice', false)
on conflict (id) do nothing;
