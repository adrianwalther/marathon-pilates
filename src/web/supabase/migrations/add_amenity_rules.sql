-- Amenity booking rules: configures open hours, slot/session durations, capacity, and cutoff per amenity type
create table if not exists public.amenity_rules (
  id uuid primary key default uuid_generate_v4(),
  session_type text not null unique,
  display_name text not null,
  open_time time not null default '07:00',
  close_time time not null default '19:30',
  slot_duration_minutes int not null,
  session_duration_minutes int not null,
  max_capacity int not null default 1,
  advance_cutoff_hours int not null default 24,
  is_active boolean not null default true,
  location_id uuid references public.locations(id),
  created_at timestamptz default now()
);

-- Default amenity configs
insert into public.amenity_rules (session_type, display_name, slot_duration_minutes, session_duration_minutes, max_capacity)
values
  ('sauna',            'Infrared Sauna',    60, 45, 4),
  ('cold_plunge',      'Cold Plunge',       30, 15, 2),
  ('contrast_therapy', 'Contrast Therapy',  45, 30, 2)
on conflict (session_type) do nothing;
