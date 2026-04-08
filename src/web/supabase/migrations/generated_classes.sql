-- Generated Classes table
-- Run this in the Supabase SQL Editor: https://supabase.com/dashboard/project/vvqeacukwsvbgixabdef/sql

create table if not exists generated_classes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text,
  duration int,
  difficulty text,
  focus_area text,
  props text[],
  class_text text not null,
  image_url text,
  created_at timestamptz default now()
);

-- Index for fast per-user queries
create index if not exists generated_classes_user_id_idx on generated_classes(user_id);

-- RLS: users can only see/save their own classes
alter table generated_classes enable row level security;

create policy "Users can read own classes"
  on generated_classes for select
  using (auth.uid() = user_id);

create policy "Users can insert own classes"
  on generated_classes for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own classes"
  on generated_classes for delete
  using (auth.uid() = user_id);
