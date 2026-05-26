-- increment_streak: 20h/48h window logic
-- <20h since last log  → same-day log, no increment (idempotent)
-- 20-48h since last log → valid next-day log, increment streak
-- >48h since last log   → streak broken, reset to 1
-- No previous log       → first log, set to 1

create or replace function public.increment_streak(p_user_id uuid)
returns void language plpgsql security definer as $$
declare
  v_last_logged_at  timestamptz;
  v_current_streak  int;
  v_longest_streak  int;
  v_total_logs      int;
  v_hours_since     float;
  v_new_streak      int;
begin
  select last_logged_at, current_streak, longest_streak, total_logs
  into v_last_logged_at, v_current_streak, v_longest_streak, v_total_logs
  from public.streaks
  where user_id = p_user_id
  for update;

  if not found then
    -- First ever entry: create streak row
    insert into public.streaks (user_id, current_streak, longest_streak, total_logs, last_logged_at)
    values (p_user_id, 1, 1, 1, now());
    return;
  end if;

  v_total_logs := coalesce(v_total_logs, 0) + 1;

  if v_last_logged_at is null then
    -- First log after row existed but empty
    v_new_streak := 1;

  else
    v_hours_since := extract(epoch from (now() - v_last_logged_at)) / 3600.0;

    if v_hours_since < 20 then
      -- Same-day log — no streak increment, just count
      update public.streaks set
        total_logs   = v_total_logs,
        updated_at   = now()
      where user_id = p_user_id;
      return;

    elsif v_hours_since <= 48 then
      -- Valid next-day window
      v_new_streak := coalesce(v_current_streak, 0) + 1;

    else
      -- Streak broken
      v_new_streak := 1;
    end if;
  end if;

  v_longest_streak := greatest(coalesce(v_longest_streak, 0), v_new_streak);

  -- Check and award streak milestones
  if v_new_streak = 7 then
    insert into public.milestones (user_id, milestone_type)
    values (p_user_id, '7day_streak')
    on conflict (user_id, milestone_type) do nothing;
  end if;

  if v_new_streak = 30 then
    insert into public.milestones (user_id, milestone_type)
    values (p_user_id, '30day_streak')
    on conflict (user_id, milestone_type) do nothing;
  end if;

  -- Award first_log milestone
  if v_total_logs = 1 then
    insert into public.milestones (user_id, milestone_type)
    values (p_user_id, 'first_log')
    on conflict (user_id, milestone_type) do nothing;
  end if;

  update public.streaks set
    current_streak = v_new_streak,
    longest_streak = v_longest_streak,
    total_logs     = v_total_logs,
    last_logged_at = now(),
    updated_at     = now()
  where user_id = p_user_id;
end;
$$;

-- Grant execute to authenticated users (called via RPC)
grant execute on function public.increment_streak(uuid) to authenticated;
grant execute on function public.increment_streak(uuid) to anon;
