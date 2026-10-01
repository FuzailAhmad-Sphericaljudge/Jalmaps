-- Reversible: drop the profile/area tables and enums in dependency order.
create type public.admin_area_level as enum ('state', 'district', 'block', 'village');
create type public.user_role as enum ('farmer', 'village_admin', 'official', 'insurer', 'admin');
create type public.unit_preference as enum ('m', 'ft');

create table public.admin_areas (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  level public.admin_area_level not null,
  parent_id uuid references public.admin_areas(id) on delete restrict,
  names jsonb not null,
  centroid_lat double precision,
  centroid_lng double precision,
  boundary_ref text,
  population bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_areas_names_object check (jsonb_typeof(names) = 'object'),
  constraint admin_areas_coordinates_pair check (
    (centroid_lat is null and centroid_lng is null)
    or (
      centroid_lat is not null
      and centroid_lng is not null
      and centroid_lat between -90 and 90
      and centroid_lng between -180 and 180
    )
  ),
  constraint admin_areas_population_nonnegative check (population is null or population >= 0),
  constraint admin_areas_parent_required check (
    (level = 'state' and parent_id is null)
    or (level <> 'state' and parent_id is not null)
  )
);

comment on table public.admin_areas is 'Hierarchical Indian administrative areas; names contain locale-to-name translations.';
comment on column public.admin_areas.boundary_ref is 'Optional reference to an externally managed boundary dataset.';

create index admin_areas_parent_id_idx on public.admin_areas(parent_id);

create function public.validate_admin_area_parent()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  parent_level public.admin_area_level;
  expected_parent_level public.admin_area_level;
begin
  if new.level = 'state' then
    return new;
  end if;

  expected_parent_level := case new.level
    when 'district' then 'state'::public.admin_area_level
    when 'block' then 'district'::public.admin_area_level
    when 'village' then 'block'::public.admin_area_level
  end;

  select area.level into parent_level
  from public.admin_areas as area
  where area.id = new.parent_id;

  if parent_level is null or parent_level <> expected_parent_level then
    raise exception 'admin area parent must be one level above %', new.level
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger admin_areas_parent_level
before insert or update of level, parent_id on public.admin_areas
for each row execute function public.validate_admin_area_parent();

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  preferred_locale text not null default 'en',
  preferred_unit public.unit_preference not null default 'm',
  role public.user_role not null default 'farmer',
  admin_area_id uuid references public.admin_areas(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_full_name_nonempty check (length(trim(full_name)) > 0)
);

comment on table public.profiles is 'Application profile and role metadata keyed to a Supabase Auth user.';
comment on column public.profiles.preferred_unit is 'Display preference only; all persisted lengths use metres.';

create index profiles_admin_area_id_idx on public.profiles(admin_area_id);
