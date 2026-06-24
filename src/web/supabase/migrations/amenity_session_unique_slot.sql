-- Prevent duplicate scheduled_session rows for the same amenity slot
-- Upsert in the booking API relies on this index for conflict resolution
create unique index if not exists scheduled_sessions_amenity_slot_uidx
  on public.scheduled_sessions (session_type, starts_at, location_id)
  where session_type in ('sauna', 'cold_plunge', 'contrast_therapy', 'neveskin');
