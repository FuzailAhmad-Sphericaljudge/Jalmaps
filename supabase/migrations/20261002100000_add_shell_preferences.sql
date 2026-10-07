-- Adds account-level accessibility and appearance preferences for Phase 6.
-- Rollback: drop the preferred_theme and preferred_text_size columns.
alter table public.profiles
  add column preferred_text_size text not null default 'normal'
    check (preferred_text_size in ('normal', 'large', 'extraLarge')),
  add column preferred_theme text not null default 'system'
    check (preferred_theme in ('system', 'light', 'dark'));

grant update (preferred_text_size, preferred_theme)
  on public.profiles to authenticated;

comment on column public.profiles.preferred_text_size is
  'User-facing text scale preference; presentation only.';
comment on column public.profiles.preferred_theme is
  'Appearance preference; system follows the device color scheme.';
