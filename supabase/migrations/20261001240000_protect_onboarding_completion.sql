revoke update (onboarding_completed_at) on public.profiles from authenticated;

create or replace function public.guard_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (new.role is distinct from old.role
      or new.admin_area_id is distinct from old.admin_area_id
      or new.deleted_at is distinct from old.deleted_at
      or new.onboarding_completed_at is distinct from old.onboarding_completed_at)
     and (select auth.uid()) is not null
     and not public.is_admin() then
    raise exception 'profile role, administrative area, onboarding state and deletion state are managed by trusted server operations'
      using errcode = '42501';
  end if;

  return new;
end;
$$;
