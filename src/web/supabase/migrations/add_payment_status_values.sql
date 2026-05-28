-- The book_session() RPC (and the booking API routes) record payment_status
-- as 'credit' (booked using a credit/membership) or 'included' (complimentary /
-- bundled). These were never added to the payment_status enum in 001_initial_schema.sql.
-- Add them idempotently so both client-side and admin-initiated bookings succeed.
--
-- Run in Supabase SQL editor. Safe to run repeatedly.

ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'credit';
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'included';
