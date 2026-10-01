begin;

select plan(231);

create function pg_temp.rls_matrix_probe(
  target_table text,
  target_operation text,
  actor_id uuid
)
returns boolean
language plpgsql
set search_path = ''
as $probe$
declare
  predicate text;
  statement text;
  affected integer := 0;
  visible boolean;
begin
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', actor_id, 'role', 'authenticated')::text,
    true
  );
  perform set_config('request.jwt.claim.sub', actor_id::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);

  if target_operation = 'select' then
    predicate := case target_table
      when 'admin_areas' then 'id = md5(''rls-matrix-admin-area'')::uuid'
      when 'profiles' then 'id = md5(''farmer.one@jalmaps.test'')::uuid'
      when 'wells' then
        case
          when actor_id = md5('farmer.one@jalmaps.test')::uuid
            then 'id = md5(''well-1'')::uuid'
          when actor_id = md5('insurer@jalmaps.test')::uuid
            then 'id = md5(''well-insurer'')::uuid'
          else 'id = md5(''well-18'')::uuid'
        end
      when 'nodes' then
        case
          when actor_id = md5('farmer.one@jalmaps.test')::uuid
            then 'id = md5(''node-1'')::uuid'
          when actor_id = md5('insurer@jalmaps.test')::uuid
            then 'id = md5(''node-insurer'')::uuid'
          else 'id = md5(''node-18'')::uuid'
        end
      when 'readings' then
        case
          when actor_id = md5('farmer.one@jalmaps.test')::uuid
            then 'id = 987654321'
          when actor_id = md5('insurer@jalmaps.test')::uuid
            then 'id = 987654323'
          else 'id = 987654322'
        end
      when 'alert_rules' then 'id = md5(''alert-rule-farmer-one'')::uuid'
      when 'alerts' then
        case when actor_id in (
          md5('village.admin@jalmaps.test')::uuid,
          md5('district.official@jalmaps.test')::uuid
        )
          then 'id = md5(''alert-lakshmipuram'')::uuid'
          else 'id = md5(''alert-farmer-one'')::uuid'
        end
      when 'notification_prefs' then
        'id = md5(''notification-'' || md5(''farmer.one@jalmaps.test'')::uuid::text)::uuid'
      when 'api_keys' then
        'id = md5(''api-key-'' || md5(''farmer.one@jalmaps.test'')::uuid::text)::uuid'
      when 'audit_log' then
        'entity_type = ''phase_5_test'' and entity_id = md5(''seed-audit-event'')::uuid'
      else null
    end case;
    if predicate is null then
      raise exception 'unknown table in RLS matrix: %', target_table;
    end if;

    execute format(
      'select exists (select 1 from public.%I where %s)',
      target_table,
      predicate
    ) into visible;
    return visible;
  end if;

  statement := case
    when target_operation = 'insert' and target_table = 'admin_areas' then
      'insert into public.admin_areas (id, code, level, parent_id, names)
       values (md5(''rls-matrix-insert-area'')::uuid, ''rls-matrix-insert-area'',
         ''village'', md5(''block-ananthapur-rural'')::uuid, ''{"en":"Probe"}''::jsonb)'
    when target_operation = 'insert' and target_table = 'profiles' then
      'insert into public.profiles (id, full_name)
       values (md5(''rls-matrix-profile@jalmaps.test'')::uuid, ''RLS matrix probe'')'
    when target_operation = 'insert' and target_table = 'wells' then
      'insert into public.wells (id, owner_id, admin_area_id, name, well_type, latitude, longitude)
       values (md5(''rls-matrix-well'')::uuid, auth.uid(),
         md5(''village-lakshmipuram'')::uuid, ''RLS matrix probe'',
         ''borewell'', 14.635, 77.610)'
    when target_operation = 'insert' and target_table = 'nodes' then
      'insert into public.nodes (id, well_id, hardware_id)
       values (md5(''rls-matrix-node'')::uuid, md5(''well-1'')::uuid, ''RLS-MATRIX-NODE'')'
    when target_operation = 'insert' and target_table = 'readings' then
      'insert into public.readings (node_id, recorded_at, column_m)
       values (md5(''node-1'')::uuid, ''2099-01-02T00:00:00Z'', 8)'
    when target_operation = 'insert' and target_table = 'alert_rules' then
      'insert into public.alert_rules
         (id, created_by, well_id, metric, operator, threshold)
       values (md5(''rls-matrix-alert-rule'')::uuid, auth.uid(),
         md5(''well-1'')::uuid, ''depth_to_water'', ''above'', 20)'
    when target_operation = 'insert' and target_table = 'alerts' then
      'insert into public.alerts (well_id, metric, severity, message_key)
       values (md5(''well-1'')::uuid, ''depth_to_water'', ''warning'', ''alerts.probe'')'
    when target_operation = 'insert' and target_table = 'notification_prefs' then
      'insert into public.notification_prefs (profile_id, channel, enabled)
       values (auth.uid(), ''whatsapp'', true)'
    when target_operation = 'insert' and target_table = 'api_keys' then
      'insert into public.api_keys (profile_id, label, key_hash, scopes)
       values (auth.uid(), ''RLS matrix probe'', repeat(''a'', 64), array[''wells:read''])'
    when target_operation = 'insert' and target_table = 'audit_log' then
      'insert into public.audit_log (actor_id, action, entity_type, entity_id)
       values (auth.uid(), ''rls_probe'', ''phase_5_test'', md5(''rls-matrix-audit'')::uuid)'
    when target_operation = 'update' and target_table = 'admin_areas' then
      'update public.admin_areas set updated_at = updated_at
       where id = md5(''rls-matrix-admin-area'')::uuid'
    when target_operation = 'update' and target_table = 'profiles' then
      'update public.profiles set full_name = full_name
       where id = md5(''farmer.one@jalmaps.test'')::uuid'
    when target_operation = 'update' and target_table = 'wells' then
      case when actor_id = md5('village.admin@jalmaps.test')::uuid then
        'update public.wells set name = name where id = md5(''well-18'')::uuid'
      else
        'update public.wells set name = name where id = md5(''well-1'')::uuid'
      end
    when target_operation = 'update' and target_table = 'nodes' then
      'update public.nodes set updated_at = updated_at where id = md5(''node-1'')::uuid'
    when target_operation = 'update' and target_table = 'readings' then
      'update public.readings set column_m = column_m where id = 987654321'
    when target_operation = 'update' and target_table = 'alert_rules' then
      'update public.alert_rules set enabled = enabled
       where id = md5(''alert-rule-farmer-one'')::uuid'
    when target_operation = 'update' and target_table = 'alerts' then
      'update public.alerts set status = status where id = md5(''alert-farmer-one'')::uuid'
    when target_operation = 'update' and target_table = 'notification_prefs' then
      'update public.notification_prefs set enabled = enabled
       where id = md5(''notification-'' || md5(''farmer.one@jalmaps.test'')::uuid::text)::uuid'
    when target_operation = 'update' and target_table = 'api_keys' then
      'update public.api_keys set label = label
       where id = md5(''api-key-'' || md5(''farmer.one@jalmaps.test'')::uuid::text)::uuid'
    when target_operation = 'update' and target_table = 'audit_log' then
      'update public.audit_log set action = action
       where entity_type = ''phase_5_test''
         and entity_id = md5(''seed-audit-event'')::uuid'
    when target_operation = 'delete' and target_table = 'admin_areas' then
      'delete from public.admin_areas where id = md5(''rls-matrix-admin-area'')::uuid'
    when target_operation = 'delete' and target_table = 'profiles' then
      'delete from public.profiles where id = md5(''farmer.one@jalmaps.test'')::uuid'
    when target_operation = 'delete' and target_table = 'wells' then
      'delete from public.wells where id = md5(''well-1'')::uuid'
    when target_operation = 'delete' and target_table = 'nodes' then
      'delete from public.nodes where id = md5(''node-1'')::uuid'
    when target_operation = 'delete' and target_table = 'readings' then
      'delete from public.readings where id = 987654321'
    when target_operation = 'delete' and target_table = 'alert_rules' then
      'delete from public.alert_rules where id = md5(''alert-rule-farmer-one'')::uuid'
    when target_operation = 'delete' and target_table = 'alerts' then
      'delete from public.alerts where id = md5(''alert-farmer-one'')::uuid'
    when target_operation = 'delete' and target_table = 'notification_prefs' then
      'delete from public.notification_prefs
       where id = md5(''notification-'' || md5(''farmer.one@jalmaps.test'')::uuid::text)::uuid'
    when target_operation = 'delete' and target_table = 'api_keys' then
      'delete from public.api_keys
       where id = md5(''api-key-'' || md5(''farmer.one@jalmaps.test'')::uuid::text)::uuid'
    when target_operation = 'delete' and target_table = 'audit_log' then
      'delete from public.audit_log
       where entity_type = ''phase_5_test''
         and entity_id = md5(''seed-audit-event'')::uuid'
    else null
  end;
  if statement is null then
    raise exception 'unknown RLS matrix operation/table: %/%',
      target_operation, target_table;
  end if;

  begin
    execute statement;
    get diagnostics affected = row_count;
    raise exception using errcode = 'ZX001';
  exception
    when sqlstate 'ZX001' then
      return affected > 0;
    when insufficient_privilege then
      return false;
  end;
end;
$probe$;

insert into auth.users (
  id, aud, role, phone, phone_confirmed_at, encrypted_password,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values (
  md5('rls-matrix-profile@jalmaps.test')::uuid,
  'authenticated',
  'authenticated',
  '+919999999998',
  now(),
  '',
  '{"provider":"phone","providers":["phone"]}',
  '{"full_name":"RLS matrix probe"}',
  now(),
  now()
);

delete from public.profiles
where id = md5('rls-matrix-profile@jalmaps.test')::uuid;

insert into public.admin_areas (id, code, level, parent_id, names)
values (
  md5('rls-matrix-admin-area')::uuid,
  'rls-matrix-admin-area',
  'village',
  md5('block-ananthapur-rural')::uuid,
  '{"en":"RLS matrix probe"}'::jsonb
);

insert into public.readings (id, node_id, recorded_at, column_m)
values
  (987654321, md5('node-1')::uuid, '2099-01-01T00:00:00Z', 8),
  (987654322, md5('node-18')::uuid, '2099-01-01T00:00:00Z', 8);

insert into public.wells (
  id, owner_id, admin_area_id, name, well_type, latitude, longitude
)
values (
  md5('well-insurer')::uuid,
  md5('insurer@jalmaps.test')::uuid,
  md5('village-lakshmipuram')::uuid,
  'Insurer-owned access probe',
  'borewell',
  14.635,
  77.610
);

insert into public.nodes (id, well_id, hardware_id)
values (
  md5('node-insurer')::uuid,
  md5('well-insurer')::uuid,
  'RLS-INSURER-NODE'
);

insert into public.readings (id, node_id, recorded_at, column_m)
values (987654323, md5('node-insurer')::uuid, '2099-01-01T00:00:00Z', 8);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', md5('farmer.one@jalmaps.test')::uuid,
    'role', 'authenticated'
  )::text,
  true
);
select set_config('request.jwt.claim.sub', md5('farmer.one@jalmaps.test'), true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is(public.auth_role()::text, 'farmer', 'role helper reads the trusted profile role');
select is((select count(*)::integer from public.profiles), 1, 'farmer reads own profile only');
select is(
  (select count(*)::integer from public.wells where owner_id = auth.uid()),
  15,
  'farmer reads all owned wells'
);
select is(
  (select count(*)::integer from public.wells where id = md5('well-2')::uuid),
  0,
  'farmer cannot read another farmer well'
);
select is(
  (select count(*)::integer from public.nodes),
  15,
  'farmer can read nodes attached to owned wells'
);
select is(
  (select count(*)::integer from public.alert_rules),
  1,
  'farmer can read own-well alert rules'
);
select is(
  (select count(*)::integer from public.alerts),
  1,
  'farmer can read alerts for owned wells'
);
select is(
  (select count(*)::integer from public.notification_prefs),
  1,
  'farmer reads own notification preferences'
);
select is(
  (select count(*)::integer from public.api_keys),
  1,
  'farmer reads own API-key metadata'
);
select is((select count(*)::integer from public.audit_log), 0, 'farmer cannot read the audit log');

select throws_ok(
  $$select api_key_hash from public.nodes limit 1$$,
  '42501',
  null,
  'client roles cannot select node API-key hashes'
);
select throws_ok(
  $$insert into public.readings (node_id, recorded_at, column_m)
    values (md5('node-1')::uuid, now(), 8)$$,
  '42501',
  null,
  'client roles cannot insert readings'
);
select throws_ok(
  $$update public.profiles set role = 'admin'
    where id = md5('farmer.one@jalmaps.test')::uuid$$,
  '42501',
  null,
  'farmer cannot escalate their own role'
);
select throws_ok(
  $$update public.profiles set admin_area_id = md5('state-telangana')::uuid
    where id = md5('farmer.one@jalmaps.test')::uuid$$,
  '42501',
  null,
  'farmer cannot move their own administrative scope'
);
select lives_ok(
  $$update public.profiles set full_name = full_name
    where id = md5('farmer.one@jalmaps.test')::uuid$$,
  'farmer can update non-privileged profile fields'
);

select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', md5('village.admin@jalmaps.test')::uuid,
    'role', 'authenticated'
  )::text,
  true
);
select set_config('request.jwt.claim.sub', md5('village.admin@jalmaps.test'), true);
select is(public.auth_role()::text, 'village_admin', 'village admin role is loaded from profile');
select is(
  (select count(*)::integer from public.user_area_ids()),
  1,
  'village admin scope contains the assigned village'
);
select ok(
  (select count(*) > 0
   from public.wells
   where admin_area_id = md5('village-lakshmipuram')::uuid),
  'village admin reads wells in the assigned village'
);
select is(
  (select count(*)::integer
   from public.wells
   where admin_area_id = md5('village-kamalapur')::uuid),
  0,
  'village admin cannot read a different village'
);
select lives_ok(
  $$update public.wells set name = name
    where admin_area_id = md5('village-lakshmipuram')::uuid$$,
  'village admin may update a well in the assigned area'
);
select is(
  (select count(*)::integer from public.alerts),
  1,
  'village admin reads alerts for wells in the assigned village'
);
select lives_ok(
  $$update public.alerts
    set status = 'acknowledged', acknowledged_at = now(), acknowledged_by = auth.uid()
    where status = 'open'$$,
  'village admin update of an in-scope alert executes'
);
select is(
  (select count(*)::integer from public.alerts where status = 'acknowledged'),
  0,
  'village admin cannot update alerts for wells in the assigned village'
);

select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', md5('district.official@jalmaps.test')::uuid,
    'role', 'authenticated'
  )::text,
  true
);
select set_config('request.jwt.claim.sub', md5('district.official@jalmaps.test'), true);
select is(public.auth_role()::text, 'official', 'official role is loaded from profile');
select ok(
  (select count(*) > 0
   from public.wells
   where admin_area_id in (select public.user_area_ids())),
  'official reads wells in descendant administrative areas'
);
select is(
  (select count(*)::integer from public.alerts),
  2,
  'official can read alert events within the assigned district'
);

select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', md5('insurer@jalmaps.test')::uuid,
    'role', 'authenticated'
  )::text,
  true
);
select set_config('request.jwt.claim.sub', md5('insurer@jalmaps.test'), true);
select is(public.auth_role()::text, 'insurer', 'insurer role is loaded from profile');
select is((select count(*)::integer from public.wells), 0, 'insurer has no direct well access');
select is((select count(*)::integer from public.readings), 0, 'insurer has no direct reading access');

reset role;

select is(public.is_admin(), false, 'unauthenticated database context is not an admin');
select ok(
  not has_table_privilege('anon', 'public.wells', 'select'),
  'anonymous role has no application-table grants'
);

set local role authenticated;

select is(
  pg_temp.rls_matrix_probe(matrix.table_name, matrix.operation, matrix.profile_id),
  matrix.allowed,
  matrix.role_name || ' ' || matrix.table_name || ' ' || upper(matrix.operation)
    || ' matches the role policy'
)
from (
  select
    role_matrix.role_name,
    role_matrix.profile_id,
    table_matrix.table_name,
    operation_matrix.operation,
    role_matrix.role_name = any(
      case operation_matrix.operation
        when 'select' then table_matrix.select_roles
        when 'insert' then table_matrix.insert_roles
        when 'update' then table_matrix.update_roles
        when 'delete' then table_matrix.delete_roles
      end
    ) as allowed
  from (values
    ('farmer', md5('farmer.one@jalmaps.test')::uuid),
    ('village_admin', md5('village.admin@jalmaps.test')::uuid),
    ('official', md5('district.official@jalmaps.test')::uuid),
    ('insurer', md5('insurer@jalmaps.test')::uuid),
    ('admin', md5('platform.admin@jalmaps.test')::uuid)
  ) as role_matrix(role_name, profile_id)
  cross join (values
    ('admin_areas',
      array['farmer', 'village_admin', 'official', 'insurer', 'admin']::text[],
      array['admin']::text[],
      array['admin']::text[],
      array['admin']::text[]),
    ('profiles',
      array['farmer', 'village_admin', 'official', 'admin']::text[],
      array['admin']::text[],
      array['farmer', 'admin']::text[],
      array['admin']::text[]),
    ('wells',
      array['farmer', 'village_admin', 'official', 'admin']::text[],
      array['farmer', 'village_admin', 'official', 'admin']::text[],
      array['farmer', 'village_admin', 'admin']::text[],
      array['farmer', 'admin']::text[]),
    ('nodes',
      array['farmer', 'village_admin', 'official', 'admin']::text[],
      array[]::text[],
      array[]::text[],
      array[]::text[]),
    ('readings',
      array['farmer', 'village_admin', 'official', 'admin']::text[],
      array[]::text[],
      array[]::text[],
      array[]::text[]),
    ('alert_rules',
      array['farmer', 'admin']::text[],
      array['farmer', 'admin']::text[],
      array['farmer', 'admin']::text[],
      array['farmer', 'admin']::text[]),
    ('alerts',
      array['farmer', 'village_admin', 'official', 'admin']::text[],
      array[]::text[],
      array['farmer', 'admin']::text[],
      array[]::text[]),
    ('notification_prefs',
      array['farmer', 'admin']::text[],
      array['farmer', 'village_admin', 'official', 'insurer', 'admin']::text[],
      array['farmer', 'admin']::text[],
      array['farmer', 'admin']::text[]),
    ('api_keys',
      array['farmer', 'admin']::text[],
      array['farmer', 'village_admin', 'official', 'insurer', 'admin']::text[],
      array['farmer', 'admin']::text[],
      array['farmer', 'admin']::text[]),
    ('audit_log',
      array['admin']::text[],
      array[]::text[],
      array[]::text[],
      array[]::text[])
  ) as table_matrix(
    table_name,
    select_roles,
    insert_roles,
    update_roles,
    delete_roles
  )
  cross join (values
    ('select'),
    ('insert'),
    ('update'),
    ('delete')
  ) as operation_matrix(operation)
) as matrix
order by matrix.role_name, matrix.table_name, matrix.operation;

reset role;

select * from finish();
rollback;
