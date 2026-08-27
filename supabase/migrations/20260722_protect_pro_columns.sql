-- Prevent clients (the `authenticated` role) from self-granting Pro.
--
-- NOTE: A column-level `revoke update (is_pro, ...) from authenticated` does NOT
-- work here, because Supabase grants a table-wide UPDATE privilege to the
-- `authenticated` role. Postgres ignores a column-level revoke while a
-- whole-table grant is held, so the pro columns would still be writable.
--
-- Instead, a BEFORE UPDATE trigger silently preserves the existing pro-column
-- values for any role other than the service role / admin. The RevenueCat
-- webhook uses the service_role key, so it can still write these columns.
-- Normal profile updates (which never include pro columns) are unaffected.

create or replace function public.prevent_pro_self_grant()
returns trigger
language plpgsql
security invoker      -- keep current_user = the actual caller (authenticated / service_role)
as $$
begin
  if (new.is_pro         is distinct from old.is_pro
      or new.pro_product_id is distinct from old.pro_product_id
      or new.pro_since      is distinct from old.pro_since
      or new.pro_expires_at is distinct from old.pro_expires_at)
     and current_user not in ('service_role', 'postgres', 'supabase_admin')
  then
    -- Revert any attempted change to entitlement columns; let the rest of the
    -- update proceed so legitimate profile edits still succeed.
    new.is_pro         := old.is_pro;
    new.pro_product_id := old.pro_product_id;
    new.pro_since      := old.pro_since;
    new.pro_expires_at := old.pro_expires_at;
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_pro_self_grant on public.profiles;
create trigger prevent_pro_self_grant
  before update on public.profiles
  for each row execute function public.prevent_pro_self_grant();
