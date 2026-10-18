-- Reversible: replace ON DELETE CASCADE with ON DELETE SET NULL on rollback.
alter table public.wells
  drop constraint wells_owner_id_fkey;

alter table public.wells
  add constraint wells_owner_id_fkey
  foreign key (owner_id)
  references public.profiles(id)
  on delete cascade;
