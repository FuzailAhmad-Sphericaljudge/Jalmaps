alter table public.profiles
  add column crops text[] not null default '{}',
  add column onboarding_completed_at timestamptz,
  add column deleted_at timestamptz;

comment on column public.profiles.crops is 'Crop preferences captured during onboarding; values are stable identifiers.';
comment on column public.profiles.onboarding_completed_at is 'UTC completion time for the initial profile setup.';
comment on column public.profiles.deleted_at is 'Soft-delete marker reserved for account-removal workflows.';

create function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    phone,
    preferred_locale,
    preferred_unit,
    role
  )
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 'JalMaps user'),
    new.phone,
    coalesce(nullif(new.raw_user_meta_data ->> 'preferred_locale', ''), 'en'),
    'm',
    'farmer'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

comment on function public.handle_new_auth_user() is
  'Creates a least-privilege farmer profile for new Supabase Auth identities.';

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

revoke all on function public.handle_new_auth_user() from public, anon, authenticated;
