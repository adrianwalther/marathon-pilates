-- SECURITY FIX (2026-06-02 audit) — applied live via MCP.
-- sync_classes_completed() is a TRIGGER function only; it should never be called
-- directly as an RPC, but anon/authenticated could invoke it via /rest/v1/rpc.
-- Revoking EXECUTE does not affect trigger firing (triggers run as table owner).
revoke execute on function public.sync_classes_completed() from public, anon, authenticated;
