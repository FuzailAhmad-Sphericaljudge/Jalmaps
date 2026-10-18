create function public.auth_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select profile.role
  from public.profiles as profile
  where profile.id = (select auth.uid())
    and profile.deleted_at is null;
$$;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.auth_role() = 'admin'::public.user_role, false);
$$;

create function public.user_area_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  with recursive area_tree(id) as (
    select profile.admin_area_id
    from public.profiles as profile
    where profile.id = (select auth.uid())
      and profile.deleted_at is null
      and profile.admin_area_id is not null

    union

    select child.id
    from public.admin_areas as child
    join area_tree as parent on child.parent_id = parent.id
  )
  select area_tree.id from area_tree;
$$;

create function public.can_read_well(target_well_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.wells as well
    where well.id = target_well_id
      and (
        well.owner_id = (select auth.uid())
        or public.is_admin()
        or (
          public.auth_role() in ('village_admin', 'official')
          and well.admin_area_id in (select public.user_area_ids())
        )
      )
  );
$$;

create function public.can_manage_well(target_well_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.wells as well
    where well.id = target_well_id
      and (
        well.owner_id = (select auth.uid())
        or public.is_admin()
        or (
          public.auth_role() = 'village_admin'
          and well.admin_area_id in (select public.user_area_ids())
        )
      )
  );
$$;

create function public.guard_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (new.role is distinct from old.role
      or new.admin_area_id is distinct from old.admin_area_id
      or new.deleted_at is distinct from old.deleted_at)
     and (select auth.uid()) is not null
     and not public.is_admin() then
    raise exception 'profile role, administrative area and deletion state are managed by trusted server operations'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger profiles_guard_privileged_fields
before update on public.profiles
for each row execute function public.guard_profile_privileged_fields();

revoke all on function public.auth_role() from public, anon;
revoke all on function public.is_admin() from public, anon;
revoke all on function public.user_area_ids() from public, anon;
revoke all on function public.can_read_well(uuid) from public, anon;
revoke all on function public.can_manage_well(uuid) from public, anon;
revoke all on function public.guard_profile_privileged_fields() from public, anon, authenticated;
grant execute on function public.auth_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.user_area_ids() to authenticated;
grant execute on function public.can_read_well(uuid) to authenticated;
grant execute on function public.can_manage_well(uuid) to authenticated;

revoke all on all tables in schema public from anon, authenticated;

grant select on public.admin_areas to authenticated;
grant insert, update, delete on public.admin_areas to authenticated;

grant select on public.profiles to authenticated;
grant insert, delete on public.profiles to authenticated;
grant update (
  full_name,
  phone,
  preferred_locale,
  preferred_unit,
  role,
  admin_area_id,
  crops,
  onboarding_completed_at,
  deleted_at
) on public.profiles to authenticated;

grant select, insert, update, delete on public.wells to authenticated;

grant select (
  id,
  well_id,
  hardware_id,
  sensor_model,
  range_m,
  hang_depth_m,
  calibration_offset_m,
  firmware_version,
  battery_v,
  signal_rssi,
  last_seen_at,
  status,
  is_simulated,
  created_at,
  updated_at
) on public.nodes to authenticated;

grant select on public.readings to authenticated;
grant select, insert, update, delete on public.alert_rules to authenticated;
grant select on public.alerts to authenticated;
grant update (status, acknowledged_at, acknowledged_by, resolved_at) on public.alerts to authenticated;
grant select, insert, update, delete on public.notification_prefs to authenticated;
grant select (id, profile_id, label, scopes, requests_per_minute, requests_per_day, last_used_at, expires_at, revoked_at, created_at)
  on public.api_keys to authenticated;
grant insert, update, delete on public.api_keys to authenticated;
grant select on public.audit_log to authenticated;
grant select on public.latest_reading to authenticated;

create policy profiles_select_scoped
on public.profiles for select to authenticated
using (
  id = (select auth.uid())
  or public.is_admin()
  or (
    public.auth_role() in ('village_admin', 'official')
    and admin_area_id in (select public.user_area_ids())
  )
);

create policy profiles_update_self
on public.profiles for update to authenticated
using (id = (select auth.uid()) and deleted_at is null)
with check (
  id = (select auth.uid())
  and role = (select public.auth_role())
  and deleted_at is null
);

create policy profiles_admin_all
on public.profiles for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy admin_areas_read_authenticated
on public.admin_areas for select to authenticated
using (true);

create policy admin_areas_admin_all
on public.admin_areas for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy wells_owner_all
on public.wells for all to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy wells_area_read
on public.wells for select to authenticated
using (
  public.auth_role() in ('village_admin', 'official')
  and admin_area_id in (select public.user_area_ids())
);

create policy wells_village_admin_update
on public.wells for update to authenticated
using (
  public.auth_role() = 'village_admin'
  and admin_area_id in (select public.user_area_ids())
)
with check (
  public.auth_role() = 'village_admin'
  and admin_area_id in (select public.user_area_ids())
);

create policy wells_admin_all
on public.wells for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy nodes_read_parent_well
on public.nodes for select to authenticated
using (public.can_read_well(well_id));

create policy readings_read_parent_well
on public.readings for select to authenticated
using (
  exists (
    select 1
    from public.nodes as node
    where node.id = readings.node_id
      and public.can_read_well(node.well_id)
  )
);

create policy alert_rules_read_own_or_area
on public.alert_rules for select to authenticated
using (
  (well_id is not null and exists (
    select 1 from public.wells as well
    where well.id = alert_rules.well_id
      and well.owner_id = (select auth.uid())
  ))
  or (admin_area_id in (select public.user_area_ids())
      and public.auth_role() in ('village_admin', 'official'))
  or public.is_admin()
);

create policy alert_rules_insert_own_well
on public.alert_rules for insert to authenticated
with check (
  created_by = (select auth.uid())
  and well_id is not null
  and exists (
    select 1 from public.wells as well
    where well.id = alert_rules.well_id
      and well.owner_id = (select auth.uid())
  )
);

create policy alert_rules_update_own_well
on public.alert_rules for update to authenticated
using (
  created_by = (select auth.uid())
  and well_id is not null
  and exists (
    select 1 from public.wells as well
    where well.id = alert_rules.well_id
      and well.owner_id = (select auth.uid())
  )
)
with check (
  created_by = (select auth.uid())
  and well_id is not null
  and exists (
    select 1 from public.wells as well
    where well.id = alert_rules.well_id
      and well.owner_id = (select auth.uid())
  )
);

create policy alert_rules_delete_own_well
on public.alert_rules for delete to authenticated
using (
  created_by = (select auth.uid())
  and well_id is not null
  and exists (
    select 1 from public.wells as well
    where well.id = alert_rules.well_id
      and well.owner_id = (select auth.uid())
  )
);

create policy alert_rules_admin_all
on public.alert_rules for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy alerts_read_own_or_area
on public.alerts for select to authenticated
using (
  public.can_manage_well(well_id)
  or (
    public.auth_role() in ('village_admin', 'official')
    and exists (
      select 1 from public.wells as well
      where well.id = alerts.well_id
        and well.admin_area_id in (select public.user_area_ids())
    )
  )
);

create policy alerts_acknowledge_owned_well
on public.alerts for update to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.wells as well
    where well.id = alerts.well_id
      and well.owner_id = (select auth.uid())
  )
)
with check (
  public.is_admin()
  or (
    exists (
      select 1 from public.wells as well
      where well.id = alerts.well_id
        and well.owner_id = (select auth.uid())
    )
    and (acknowledged_by is null or acknowledged_by = (select auth.uid()))
  )
);

create policy alerts_admin_all
on public.alerts for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy notification_prefs_own_all
on public.notification_prefs for all to authenticated
using (profile_id = (select auth.uid()))
with check (profile_id = (select auth.uid()));

create policy notification_prefs_admin_all
on public.notification_prefs for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy api_keys_owner_all
on public.api_keys for all to authenticated
using (profile_id = (select auth.uid()))
with check (profile_id = (select auth.uid()));

create policy api_keys_admin_all
on public.api_keys for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy audit_log_admin_read
on public.audit_log for select to authenticated
using (public.is_admin());

create policy audit_log_admin_all
on public.audit_log for all to authenticated
using (public.is_admin())
with check (public.is_admin());
