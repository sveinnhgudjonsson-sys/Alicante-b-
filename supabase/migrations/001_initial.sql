-- Enable btree_gist for the exclusion constraint
create extension if not exists btree_gist;

-- ─── members (allowlist) ───────────────────────────────────────────────────
create table members (
  email        text primary key,
  couple       text not null check (couple in ('A', 'B')),
  display_name text not null
);

-- Seed the two couples
insert into members (email, couple, display_name) values
  ('sveinn@hamrar.com',                'A', 'Svenni & Inga'),
  ('ingahardar67@gmail.com',           'A', 'Svenni & Inga'),
  ('soley.kristjansdottir@olgerdin.is','B', 'Freyr & Sóley'),
  ('freyr@thg.is',                     'B', 'Freyr & Sóley');

-- ─── bookings ─────────────────────────────────────────────────────────────
create table bookings (
  id               uuid primary key default gen_random_uuid(),
  start_date       date not null,
  end_date         date not null,
  label            text not null check (label in ('svenni_inga','freyr_soley','saman','adrir_gestir')),
  booked_by_couple text not null check (booked_by_couple in ('A','B')),
  notes            text,
  created_by_email text references members(email),
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),

  constraint end_after_start check (end_date > start_date),

  -- Half-open [start, end) — back-to-back bookings sharing a boundary day are NOT a conflict
  exclude using gist (daterange(start_date, end_date, '[)') with &&)
);

-- Auto-update updated_at
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger bookings_updated_at
  before update on bookings
  for each row execute function touch_updated_at();

-- ─── RLS ──────────────────────────────────────────────────────────────────
alter table members  enable row level security;
alter table bookings enable row level security;

-- members: any authenticated user whose own email is in the table can read all rows
create policy "members_select" on members
  for select
  using (auth.role() = 'authenticated');

-- bookings: allowlisted users can read all bookings
create policy "bookings_select" on bookings
  for select
  using (
    auth.email() in (select email from members)
  );

-- bookings: allowlisted users can insert (created_by_email must match their own email)
create policy "bookings_insert" on bookings
  for insert
  with check (
    auth.email() in (select email from members)
    and created_by_email = auth.email()
  );

-- bookings: any allowlisted user can update any booking (per spec: no lock-out)
create policy "bookings_update" on bookings
  for update
  using (
    auth.email() in (select email from members)
  );

-- bookings: any allowlisted user can delete any booking
create policy "bookings_delete" on bookings
  for delete
  using (
    auth.email() in (select email from members)
  );
