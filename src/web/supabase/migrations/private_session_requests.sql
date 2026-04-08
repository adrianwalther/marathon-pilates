-- Private Session Requests table
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/vvqeacukwsvbgixabdef/sql

create table if not exists private_session_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references auth.users(id) on delete cascade,
  session_type text not null check (session_type in ('private_solo', 'private_duet', 'private_trio')),
  location text not null check (location in ('charlotte_park', 'green_hills', 'no_preference')),
  preferred_dates text[], -- e.g. ['Monday mornings', 'Wednesday afternoons']
  focus_area text,
  notes text,
  -- Admin fields
  status text not null default 'pending' check (status in ('pending', 'proposed', 'confirmed', 'declined', 'cancelled')),
  assigned_instructor_id uuid references auth.users(id),
  proposed_time timestamptz,
  admin_notes text,
  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists private_requests_client_id_idx on private_session_requests(client_id);
create index if not exists private_requests_status_idx on private_session_requests(status);

alter table private_session_requests enable row level security;

create policy "Clients can read own requests"
  on private_session_requests for select
  using (auth.uid() = client_id);

create policy "Clients can insert own requests"
  on private_session_requests for insert
  with check (auth.uid() = client_id);

create policy "Clients can cancel own requests"
  on private_session_requests for update
  using (auth.uid() = client_id)
  with check (status = 'cancelled');
