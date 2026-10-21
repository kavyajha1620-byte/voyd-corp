-- VOYD CORP — "You Said It, Not Us." production storage.
-- Run this once in the Supabase SQL editor for the project that will serve the live site.
--
-- It creates:
--   1. the `testimonials` table (one row per submission),
--   2. the `voyd-screenshots` storage bucket for hero screenshots,
--   3. permissive-but-scoped access policies.
--
-- The site only ever talks to Supabase with the SERVICE ROLE key from a serverless
-- function, so the anon/public key is never used and the table is never exposed to
-- the browser directly. Row Level Security is still enabled with no public policies,
-- so even the anon key cannot read pending submissions.

create extension if not exists "pgcrypto";

create table if not exists public.testimonials (
  id                text primary key,
  "createdAt"       timestamptz not null default now(),
  "updatedAt"       timestamptz not null default now(),
  status            text not null default 'pending',   -- pending | approved | rejected
  published         boolean not null default false,
  "publishedAt"     timestamptz,
  "reviewedAt"      timestamptz,

  "clientName"      text not null default '',
  project           text not null default '',
  email             text not null default '',
  role              text not null default '',
  url               text not null default '',
  testimonial       text not null default '',
  work              text not null default '',
  details           text not null default '',

  attribution       text not null default 'anonymous', -- full | name | business | anonymous
  consent           boolean not null default false,
  "consentAt"       timestamptz,

  screenshot        jsonb,                             -- { "id": "sub_....png", "mime": "image/png" } or null
  "allowScreenshot" boolean not null default true,

  embed             text not null default 'off',       -- on | off
  "embedCheckedAt"  timestamptz,

  source            jsonb                              -- { "ipHash": "...", "ua": "...", "elapsedMs": 1234 }
);

create index if not exists testimonials_status_idx on public.testimonials (status);
create index if not exists testimonials_published_idx on public.testimonials (published, "publishedAt" desc);
create index if not exists testimonials_created_idx on public.testimonials ("createdAt" desc);

alter table public.testimonials enable row level security;
-- No policies are added: only the service-role key (used by the serverless API)
-- may read or write. The public site reads through the API, never this table.

-- ── storage ────────────────────────────────────────────────────────────────
-- Private bucket: files are only reachable through the API (service role) or,
-- once an entry is approved + published, the API streams the bytes itself.

insert into storage.buckets (id, name, public)
values ('voyd-screenshots', 'voyd-screenshots', false)
on conflict (id) do nothing;

-- No public storage policies are added, for the same reason as the table.
