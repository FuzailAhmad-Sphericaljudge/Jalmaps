create or replace function public.can_read_well(target_well_id uuid)
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
        (
          public.auth_role() <> 'insurer'::public.user_role
          and well.owner_id = (select auth.uid())
        )
        or public.is_admin()
        or (
          public.auth_role() in ('village_admin', 'official')
          and well.admin_area_id in (select public.user_area_ids())
        )
      )
  );
$$;

create or replace function public.can_manage_well(target_well_id uuid)
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
        (
          public.auth_role() <> 'insurer'::public.user_role
          and well.owner_id = (select auth.uid())
        )
        or public.is_admin()
        or (
          public.auth_role() = 'village_admin'
          and well.admin_area_id in (select public.user_area_ids())
        )
      )
  );
$$;

drop policy wells_owner_all on public.wells;
create policy wells_owner_all
on public.wells for all to authenticated
using (
  public.auth_role() <> 'insurer'::public.user_role
  and owner_id = (select auth.uid())
)
with check (
  public.auth_role() <> 'insurer'::public.user_role
  and owner_id = (select auth.uid())
);

drop policy alert_rules_read_own_or_area on public.alert_rules;
create policy alert_rules_read_own_or_area
on public.alert_rules for select to authenticated
using (
  (
    well_id is not null
    and public.auth_role() <> 'insurer'::public.user_role
    and exists (
      select 1 from public.wells as well
      where well.id = alert_rules.well_id
        and well.owner_id = (select auth.uid())
    )
  )
  or (admin_area_id in (select public.user_area_ids())
      and public.auth_role() in ('village_admin', 'official'))
  or public.is_admin()
);

drop policy alerts_acknowledge_owned_well on public.alerts;
create policy alerts_acknowledge_owned_well
on public.alerts for update to authenticated
using (
  public.is_admin()
  or (
    public.auth_role() <> 'insurer'::public.user_role
    and exists (
      select 1 from public.wells as well
      where well.id = alerts.well_id
        and well.owner_id = (select auth.uid())
    )
  )
)
with check (
  public.is_admin()
  or (
    public.auth_role() <> 'insurer'::public.user_role
    and exists (
      select 1 from public.wells as well
      where well.id = alerts.well_id
        and well.owner_id = (select auth.uid())
    )
    and (acknowledged_by is null or acknowledged_by = (select auth.uid()))
  )
);
