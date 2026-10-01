-- Development-only geographic fixtures for Andhra Pradesh and Telangana.
-- Every identifier is derived from a stable code so repeated resets are deterministic.
insert into public.admin_areas (
  id, code, level, parent_id, names, centroid_lat, centroid_lng, population
)
values
  (
    md5('state-andhra-pradesh')::uuid,
    'state-andhra-pradesh',
    'state',
    null,
    '{"en":"Andhra Pradesh","hi":"आंध्र प्रदेश"}'::jsonb,
    15.9129,
    79.7400,
    49577103
  ),
  (
    md5('state-telangana')::uuid,
    'state-telangana',
    'state',
    null,
    '{"en":"Telangana","hi":"तेलंगाना"}'::jsonb,
    18.1124,
    79.0193,
    35003674
  )
on conflict (code) do update set
  level = excluded.level,
  parent_id = excluded.parent_id,
  names = excluded.names,
  centroid_lat = excluded.centroid_lat,
  centroid_lng = excluded.centroid_lng,
  population = excluded.population;

insert into public.admin_areas (
  id, code, level, parent_id, names, centroid_lat, centroid_lng, population
)
values
  (
    md5('district-anantapur')::uuid,
    'district-anantapur',
    'district',
    md5('state-andhra-pradesh')::uuid,
    '{"en":"Anantapur","hi":"अनंतपुर"}'::jsonb,
    14.6819,
    77.6006,
    4083315
  ),
  (
    md5('district-kurnool')::uuid,
    'district-kurnool',
    'district',
    md5('state-andhra-pradesh')::uuid,
    '{"en":"Kurnool","hi":"कुरनूल"}'::jsonb,
    15.8281,
    78.0373,
    4053463
  ),
  (
    md5('district-warangal')::uuid,
    'district-warangal',
    'district',
    md5('state-telangana')::uuid,
    '{"en":"Warangal","hi":"वारंगल"}'::jsonb,
    17.9689,
    79.5941,
    3512576
  ),
  (
    md5('district-karimnagar')::uuid,
    'district-karimnagar',
    'district',
    md5('state-telangana')::uuid,
    '{"en":"Karimnagar","hi":"करीमनगर"}'::jsonb,
    18.4386,
    79.1288,
    3776269
  )
on conflict (code) do update set
  level = excluded.level,
  parent_id = excluded.parent_id,
  names = excluded.names,
  centroid_lat = excluded.centroid_lat,
  centroid_lng = excluded.centroid_lng,
  population = excluded.population;

insert into public.admin_areas (
  id, code, level, parent_id, names, centroid_lat, centroid_lng, population
)
values
  (md5('block-ananthapur-rural')::uuid, 'block-ananthapur-rural', 'block', md5('district-anantapur')::uuid, '{"en":"Anantapur Rural","hi":"अनंतपुर ग्रामीण"}'::jsonb, 14.6200, 77.6300, 158000),
  (md5('block-guntakal')::uuid, 'block-guntakal', 'block', md5('district-anantapur')::uuid, '{"en":"Guntakal","hi":"गुंतकल"}'::jsonb, 15.1700, 77.3700, 210000),
  (md5('block-dharmavaram')::uuid, 'block-dharmavaram', 'block', md5('district-anantapur')::uuid, '{"en":"Dharmavaram","hi":"धर्मावरम"}'::jsonb, 14.4100, 77.7200, 185000),
  (md5('block-adoni')::uuid, 'block-adoni', 'block', md5('district-kurnool')::uuid, '{"en":"Adoni","hi":"आदוני"}'::jsonb, 15.6300, 77.2800, 240000),
  (md5('block-nandyal')::uuid, 'block-nandyal', 'block', md5('district-kurnool')::uuid, '{"en":"Nandyal","hi":"नंद्याल"}'::jsonb, 15.4800, 78.4800, 225000),
  (md5('block-yemmiganur')::uuid, 'block-yemmiganur', 'block', md5('district-kurnool')::uuid, '{"en":"Yemmiganur","hi":"येम्मिगनूर"}'::jsonb, 15.7300, 77.4900, 175000),
  (md5('block-parkal')::uuid, 'block-parkal', 'block', md5('district-warangal')::uuid, '{"en":"Parkal","hi":"परकल"}'::jsonb, 18.1900, 79.7100, 160000),
  (md5('block-narsampet')::uuid, 'block-narsampet', 'block', md5('district-warangal')::uuid, '{"en":"Narsampet","hi":"नरसंपेट"}'::jsonb, 17.9300, 79.9000, 190000),
  (md5('block-ghanpur')::uuid, 'block-ghanpur', 'block', md5('district-warangal')::uuid, '{"en":"Ghanpur","hi":"घनपुर"}'::jsonb, 17.9900, 79.5500, 155000),
  (md5('block-huzurabad')::uuid, 'block-huzurabad', 'block', md5('district-karimnagar')::uuid, '{"en":"Huzurabad","hi":"हुजुराबाद"}'::jsonb, 18.2000, 79.4000, 165000),
  (md5('block-jammikunta')::uuid, 'block-jammikunta', 'block', md5('district-karimnagar')::uuid, '{"en":"Jammikunta","hi":"जम्मीकुंटा"}'::jsonb, 18.2900, 79.4800, 150000),
  (md5('block-manakondur')::uuid, 'block-manakondur', 'block', md5('district-karimnagar')::uuid, '{"en":"Manakondur","hi":"मनकोंडूर"}'::jsonb, 18.3900, 79.1400, 145000)
on conflict (code) do update set
  level = excluded.level,
  parent_id = excluded.parent_id,
  names = excluded.names,
  centroid_lat = excluded.centroid_lat,
  centroid_lng = excluded.centroid_lng,
  population = excluded.population;

insert into public.admin_areas (
  id, code, level, parent_id, names, centroid_lat, centroid_lng, population
)
values
  (md5('village-lakshmipuram')::uuid, 'village-lakshmipuram', 'village', md5('block-ananthapur-rural')::uuid, '{"en":"Lakshmipuram","hi":"लक्ष्मीपुरम"}'::jsonb, 14.6350, 77.6100, 3200),
  (md5('village-papampeta')::uuid, 'village-papampeta', 'village', md5('block-ananthapur-rural')::uuid, '{"en":"Papampeta","hi":"पापमपेटा"}'::jsonb, 14.6050, 77.6450, 2700),
  (md5('village-kakkalapalli')::uuid, 'village-kakkalapalli', 'village', md5('block-ananthapur-rural')::uuid, '{"en":"Kakkalapalli","hi":"कक्कलापल्ली"}'::jsonb, 14.6600, 77.6700, 4100),
  (md5('village-guntakal-rural')::uuid, 'village-guntakal-rural', 'village', md5('block-guntakal')::uuid, '{"en":"Guntakal Rural","hi":"गुंतकल ग्रामीण"}'::jsonb, 15.1800, 77.3500, 3900),
  (md5('village-nagasanipalli')::uuid, 'village-nagasanipalli', 'village', md5('block-guntakal')::uuid, '{"en":"Nagasanipalli","hi":"नागसनीपल्ली"}'::jsonb, 15.1450, 77.3950, 2400),
  (md5('village-timmapuram')::uuid, 'village-timmapuram', 'village', md5('block-guntakal')::uuid, '{"en":"Timmapuram","hi":"तिम्मापुरम"}'::jsonb, 15.2050, 77.3250, 3100),
  (md5('village-bathalapalli')::uuid, 'village-bathalapalli', 'village', md5('block-dharmavaram')::uuid, '{"en":"Bathalapalli","hi":"बथलापल्ली"}'::jsonb, 14.4600, 77.7200, 3600),
  (md5('village-chennakothapalli')::uuid, 'village-chennakothapalli', 'village', md5('block-dharmavaram')::uuid, '{"en":"Chennakothapalli","hi":"चेननाकोट्टापल्ली"}'::jsonb, 14.4250, 77.6900, 2800),
  (md5('village-elukuntla')::uuid, 'village-elukuntla', 'village', md5('block-dharmavaram')::uuid, '{"en":"Elukuntla","hi":"एलुकुंटला"}'::jsonb, 14.3900, 77.7550, 2200),
  (md5('village-pedda-hulthi')::uuid, 'village-pedda-hulthi', 'village', md5('block-adoni')::uuid, '{"en":"Pedda Hulthi","hi":"पेद्दा हुल्थी"}'::jsonb, 15.6650, 77.2650, 3400),
  (md5('village-chinna-gonahalli')::uuid, 'village-chinna-gonahalli', 'village', md5('block-adoni')::uuid, '{"en":"Chinna Gonahalli","hi":"चिन्ना गोनाहल्ली"}'::jsonb, 15.6100, 77.3000, 2600),
  (md5('village-santhekudlur')::uuid, 'village-santhekudlur', 'village', md5('block-adoni')::uuid, '{"en":"Santhekudlur","hi":"सांथे कुदलूर"}'::jsonb, 15.6400, 77.2450, 2900),
  (md5('village-ayyalu')::uuid, 'village-ayyalu', 'village', md5('block-nandyal')::uuid, '{"en":"Ayyalu","hi":"अय्यालु"}'::jsonb, 15.4950, 78.4650, 2500),
  (md5('village-krishnapuram')::uuid, 'village-krishnapuram', 'village', md5('block-nandyal')::uuid, '{"en":"Krishnapuram","hi":"कृष्णापुरम"}'::jsonb, 15.4550, 78.5000, 3300),
  (md5('village-ramalingayapalli')::uuid, 'village-ramalingayapalli', 'village', md5('block-nandyal')::uuid, '{"en":"Ramalingayapalli","hi":"रामलिंगयापल्ली"}'::jsonb, 15.5200, 78.5200, 2100),
  (md5('village-kallukunta')::uuid, 'village-kallukunta', 'village', md5('block-yemmiganur')::uuid, '{"en":"Kallukunta","hi":"कल्लुकुंटा"}'::jsonb, 15.7500, 77.4750, 2800),
  (md5('village-pedda-kadubur')::uuid, 'village-pedda-kadubur', 'village', md5('block-yemmiganur')::uuid, '{"en":"Pedda Kadubur","hi":"पेद्दा कडुबूर"}'::jsonb, 15.7050, 77.5200, 3700),
  (md5('village-nehru-nagar')::uuid, 'village-nehru-nagar', 'village', md5('block-yemmiganur')::uuid, '{"en":"Nehru Nagar","hi":"नेहरू नगर"}'::jsonb, 15.7750, 77.5350, 1900),
  (md5('village-cherial')::uuid, 'village-cherial', 'village', md5('block-parkal')::uuid, '{"en":"Cherial","hi":"चेरियाल"}'::jsonb, 18.2100, 79.6900, 3100),
  (md5('village-kamalapur')::uuid, 'village-kamalapur', 'village', md5('block-parkal')::uuid, '{"en":"Kamalapur","hi":"कमलापुर"}'::jsonb, 18.1700, 79.7350, 2600),
  (md5('village-narlapur')::uuid, 'village-narlapur', 'village', md5('block-parkal')::uuid, '{"en":"Narlapur","hi":"नारलापुर"}'::jsonb, 18.2350, 79.7550, 2300),
  (md5('village-madhira-pet')::uuid, 'village-madhira-pet', 'village', md5('block-narsampet')::uuid, '{"en":"Madhira Pet","hi":"माधिरा पेट"}'::jsonb, 17.9450, 79.8850, 2900),
  (md5('village-rajupet')::uuid, 'village-rajupet', 'village', md5('block-narsampet')::uuid, '{"en":"Rajupet","hi":"राजुपेट"}'::jsonb, 17.9100, 79.9250, 3500),
  (md5('village-govindapuram')::uuid, 'village-govindapuram', 'village', md5('block-narsampet')::uuid, '{"en":"Govindapuram","hi":"गोविंदापुरम"}'::jsonb, 17.9700, 79.9400, 2000),
  (md5('village-ghanpur-khalsa')::uuid, 'village-ghanpur-khalsa', 'village', md5('block-ghanpur')::uuid, '{"en":"Ghanpur Khalsa","hi":"घनपुर खालसा"}'::jsonb, 18.0050, 79.5350, 2700),
  (md5('village-venkatapur')::uuid, 'village-venkatapur', 'village', md5('block-ghanpur')::uuid, '{"en":"Venkatapur","hi":"वेंकटापुर"}'::jsonb, 17.9750, 79.5750, 3200),
  (md5('village-ramachandrapuram')::uuid, 'village-ramachandrapuram', 'village', md5('block-ghanpur')::uuid, '{"en":"Ramachandrapuram","hi":"रामचंद्रपुरम"}'::jsonb, 18.0350, 79.5700, 2400),
  (md5('village-singapur')::uuid, 'village-singapur', 'village', md5('block-huzurabad')::uuid, '{"en":"Singapur","hi":"सिंगापुर"}'::jsonb, 18.2100, 79.3800, 2800),
  (md5('village-pothireddypet')::uuid, 'village-pothireddypet', 'village', md5('block-huzurabad')::uuid, '{"en":"Pothireddypet","hi":"पोथीरेड्डीपेट"}'::jsonb, 18.1750, 79.4250, 3400),
  (md5('village-kandugula')::uuid, 'village-kandugula', 'village', md5('block-huzurabad')::uuid, '{"en":"Kandugula","hi":"कंदुगुला"}'::jsonb, 18.2450, 79.4450, 2200),
  (md5('village-vavilala')::uuid, 'village-vavilala', 'village', md5('block-jammikunta')::uuid, '{"en":"Vavilala","hi":"वविलाला"}'::jsonb, 18.3050, 79.4650, 3000),
  (md5('village-korapalli')::uuid, 'village-korapalli', 'village', md5('block-jammikunta')::uuid, '{"en":"Korapalli","hi":"कोरापल्ली"}'::jsonb, 18.2700, 79.5050, 2500),
  (md5('village-pothugal')::uuid, 'village-pothugal', 'village', md5('block-jammikunta')::uuid, '{"en":"Pothugal","hi":"पोथुगल"}'::jsonb, 18.3350, 79.5100, 2100),
  (md5('village-gangipalli')::uuid, 'village-gangipalli', 'village', md5('block-manakondur')::uuid, '{"en":"Gangipalli","hi":"गंगिपल्ली"}'::jsonb, 18.4050, 79.1200, 2600),
  (md5('village-devampalli')::uuid, 'village-devampalli', 'village', md5('block-manakondur')::uuid, '{"en":"Devampalli","hi":"देवमपल्ली"}'::jsonb, 18.3650, 79.1600, 3100),
  (md5('village-velichala')::uuid, 'village-velichala', 'village', md5('block-manakondur')::uuid, '{"en":"Velichala","hi":"वेलिचाला"}'::jsonb, 18.4300, 79.1800, 2300)
on conflict (code) do update set
  level = excluded.level,
  parent_id = excluded.parent_id,
  names = excluded.names,
  centroid_lat = excluded.centroid_lat,
  centroid_lng = excluded.centroid_lng,
  population = excluded.population;

with sample_people (email, phone, full_name, role, area_code, preferred_locale) as (
  values
    ('farmer.one@jalmaps.test', '+919000000001', 'Ravi Kumar', 'farmer'::public.user_role, 'village-lakshmipuram', 'te'),
    ('farmer.two@jalmaps.test', '+919000000002', 'Sita Devi', 'farmer'::public.user_role, 'village-papampeta', 'hi'),
    ('village.admin@jalmaps.test', '+919000000003', 'Anil Reddy', 'village_admin'::public.user_role, 'village-lakshmipuram', 'te'),
    ('district.official@jalmaps.test', '+919000000004', 'Meena Rao', 'official'::public.user_role, 'district-anantapur', 'en'),
    ('insurer@jalmaps.test', '+919000000005', 'Arjun Shah', 'insurer'::public.user_role, 'state-andhra-pradesh', 'en'),
    ('platform.admin@jalmaps.test', '+919000000006', 'Kavita Sharma', 'admin'::public.user_role, 'state-telangana', 'hi')
)
insert into auth.users (
  id, instance_id, aud, role, email, phone, encrypted_password, email_confirmed_at, phone_confirmed_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
-- Local Supabase's test-OTP identities are stored without the leading plus.
select
  md5(email)::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  email,
  ltrim(phone, '+'),
  '',
  now(),
  now(),
  '',
  '',
  '',
  '',
  '{"provider":"phone","providers":["phone","email"]}'::jsonb,
  jsonb_build_object('full_name', full_name, 'preferred_locale', preferred_locale),
  now(),
  now()
from sample_people
on conflict (id) do update set
  instance_id = excluded.instance_id,
  email = excluded.email,
  phone = excluded.phone,
  phone_confirmed_at = excluded.phone_confirmed_at,
  confirmation_token = excluded.confirmation_token,
  recovery_token = excluded.recovery_token,
  email_change_token_new = excluded.email_change_token_new,
  email_change = excluded.email_change,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = now();

with sample_people (email, phone, full_name, role, area_code, preferred_locale) as (
  values
    ('farmer.one@jalmaps.test', '+919000000001', 'Ravi Kumar', 'farmer'::public.user_role, 'village-lakshmipuram', 'te'),
    ('farmer.two@jalmaps.test', '+919000000002', 'Sita Devi', 'farmer'::public.user_role, 'village-papampeta', 'hi'),
    ('village.admin@jalmaps.test', '+919000000003', 'Anil Reddy', 'village_admin'::public.user_role, 'village-lakshmipuram', 'te'),
    ('district.official@jalmaps.test', '+919000000004', 'Meena Rao', 'official'::public.user_role, 'district-anantapur', 'en'),
    ('insurer@jalmaps.test', '+919000000005', 'Arjun Shah', 'insurer'::public.user_role, 'state-andhra-pradesh', 'en'),
    ('platform.admin@jalmaps.test', '+919000000006', 'Kavita Sharma', 'admin'::public.user_role, 'state-telangana', 'hi')
)
insert into public.profiles (
  id, full_name, phone, role, admin_area_id, preferred_locale, crops, onboarding_completed_at
)
select
  md5(person.email)::uuid,
  person.full_name,
  person.phone,
  person.role,
  md5(person.area_code)::uuid,
  person.preferred_locale,
  array['millet', 'groundnut'],
  now()
from sample_people as person
on conflict (id) do update set
  full_name = excluded.full_name,
  phone = excluded.phone,
  role = excluded.role,
  admin_area_id = excluded.admin_area_id,
  preferred_locale = excluded.preferred_locale,
  crops = excluded.crops,
  onboarding_completed_at = excluded.onboarding_completed_at;

insert into auth.users (
  id, instance_id, aud, role, email, phone, encrypted_password, email_confirmed_at, phone_confirmed_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values (
  md5('onboarding@jalmaps.test')::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  'onboarding@jalmaps.test',
  '919000000007',
  '',
  now(),
  now(),
  '',
  '',
  '',
  '',
  '{"provider":"phone","providers":["phone","email"]}'::jsonb,
  '{"full_name":"Onboarding Test Farmer","preferred_locale":"hi"}'::jsonb,
  now(),
  now()
)
on conflict (id) do update set
  instance_id = excluded.instance_id,
  email = excluded.email,
  phone = excluded.phone,
  phone_confirmed_at = excluded.phone_confirmed_at,
  confirmation_token = excluded.confirmation_token,
  recovery_token = excluded.recovery_token,
  email_change_token_new = excluded.email_change_token_new,
  email_change = excluded.email_change,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = now();

insert into auth.identities (
  provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
)
select
  id::text,
  id,
  jsonb_build_object('sub', id::text, 'phone', phone, 'phone_verified', true),
  'phone',
  now(),
  created_at,
  updated_at
from auth.users
where phone like '91900000000%'
on conflict (provider_id, provider) do update set
  user_id = excluded.user_id,
  identity_data = excluded.identity_data,
  last_sign_in_at = excluded.last_sign_in_at,
  updated_at = excluded.updated_at;

insert into auth.identities (
  provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
)
select
  id::text,
  id,
  jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true),
  'email',
  now(),
  created_at,
  updated_at
from auth.users
where email like '%@jalmaps.test'
on conflict (provider_id, provider) do update set
  user_id = excluded.user_id,
  identity_data = excluded.identity_data,
  last_sign_in_at = excluded.last_sign_in_at,
  updated_at = excluded.updated_at;

insert into public.wells (
  id, owner_id, admin_area_id, name, well_type, latitude, longitude,
  total_depth_m, installed_at, status, visibility, notes
)
select
  md5('well-' || well_number)::uuid,
  case when well_number % 2 = 0 then md5('farmer.two@jalmaps.test')::uuid
       else md5('farmer.one@jalmaps.test')::uuid end,
  village.id,
  'Community ' || case when well_number % 3 = 0 then 'open well ' else 'borewell ' end || lpad(well_number::text, 2, '0'),
  case when well_number % 3 = 0 then 'open_well'::public.well_type else 'borewell'::public.well_type end,
  village.centroid_lat + (well_number % 5) * 0.001,
  village.centroid_lng + (well_number % 7) * 0.001,
  35 + (well_number % 9) * 5,
  date '2019-01-01' + (well_number * 37),
  'active',
  'admin_area',
  'Development fixture; simulated sensor data only.'
from generate_series(1, 30) as well_numbers(well_number)
join lateral (
  select area.id, area.centroid_lat, area.centroid_lng
  from public.admin_areas as area
  where area.level = 'village'
  order by area.code
  offset ((well_number - 1) % 24)
  limit 1
) as village on true
on conflict (id) do update set
  owner_id = excluded.owner_id,
  admin_area_id = excluded.admin_area_id,
  name = excluded.name,
  well_type = excluded.well_type,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  total_depth_m = excluded.total_depth_m,
  installed_at = excluded.installed_at,
  status = excluded.status,
  visibility = excluded.visibility,
  notes = excluded.notes;

insert into public.nodes (
  id, well_id, hardware_id, sensor_model, range_m, hang_depth_m,
  calibration_offset_m, firmware_version, battery_v, signal_rssi,
  last_seen_at, status, is_simulated
)
select
  md5('node-' || well_number)::uuid,
  md5('well-' || well_number)::uuid,
  'SIM-JAL-' || lpad(well_number::text, 5, '0'),
  'JalSense-Pressure-v1',
  50,
  30 + (well_number % 9) * 5,
  0,
  'sim-1.0.0',
  3.6,
  -70 - (well_number % 16),
  now() - well_number * interval '1 minute',
  'active',
  true
from generate_series(1, 30) as well_numbers(well_number)
on conflict (id) do update set
  well_id = excluded.well_id,
  hardware_id = excluded.hardware_id,
  sensor_model = excluded.sensor_model,
  range_m = excluded.range_m,
  hang_depth_m = excluded.hang_depth_m,
  firmware_version = excluded.firmware_version,
  battery_v = excluded.battery_v,
  signal_rssi = excluded.signal_rssi,
  last_seen_at = excluded.last_seen_at,
  status = excluded.status,
  is_simulated = excluded.is_simulated;

insert into public.alert_rules (
  id, created_by, well_id, metric, operator, threshold, severity, channels
)
values (
  md5('alert-rule-farmer-one')::uuid,
  md5('farmer.one@jalmaps.test')::uuid,
  md5('well-1')::uuid,
  'depth_to_water',
  'above',
  25,
  'warning',
  array['sms']::public.notification_channel[]
)
on conflict (id) do update set
  created_by = excluded.created_by,
  well_id = excluded.well_id,
  metric = excluded.metric,
  operator = excluded.operator,
  threshold = excluded.threshold,
  severity = excluded.severity,
  channels = excluded.channels;

insert into public.alert_rules (
  id, created_by, well_id, metric, operator, threshold, severity, channels
)
values
  (
    md5('alert-rule-farmer-two-anantapur')::uuid,
    md5('farmer.two@jalmaps.test')::uuid,
    md5('well-2')::uuid,
    'battery',
    'below',
    3,
    'critical',
    array['sms']::public.notification_channel[]
  ),
  (
    md5('alert-rule-farmer-two-lakshmipuram')::uuid,
    md5('farmer.two@jalmaps.test')::uuid,
    md5('well-18')::uuid,
    'depth_to_water',
    'above',
    28,
    'warning',
    array['sms']::public.notification_channel[]
  )
on conflict (id) do update set
  created_by = excluded.created_by,
  well_id = excluded.well_id,
  metric = excluded.metric,
  operator = excluded.operator,
  threshold = excluded.threshold,
  severity = excluded.severity,
  channels = excluded.channels;

insert into public.alerts (
  id, rule_id, well_id, node_id, metric, severity, message_key, details
)
values (
  md5('alert-farmer-one')::uuid,
  md5('alert-rule-farmer-one')::uuid,
  md5('well-1')::uuid,
  md5('node-1')::uuid,
  'depth_to_water',
  'warning',
  'alerts.depthThreshold',
  '{"source":"development_seed"}'::jsonb
)
on conflict (id) do update set
  rule_id = excluded.rule_id,
  well_id = excluded.well_id,
  node_id = excluded.node_id,
  metric = excluded.metric,
  severity = excluded.severity,
  message_key = excluded.message_key,
  details = excluded.details;

insert into public.alerts (
  id, rule_id, well_id, node_id, metric, severity, message_key, details
)
values
  (
    md5('alert-anantapur')::uuid,
    md5('alert-rule-farmer-two-anantapur')::uuid,
    md5('well-2')::uuid,
    md5('node-2')::uuid,
    'battery',
    'critical',
    'alerts.lowBattery',
    '{"source":"development_seed"}'::jsonb
  ),
  (
    md5('alert-lakshmipuram')::uuid,
    md5('alert-rule-farmer-two-lakshmipuram')::uuid,
    md5('well-18')::uuid,
    md5('node-18')::uuid,
    'depth_to_water',
    'warning',
    'alerts.depthThreshold',
    '{"source":"development_seed"}'::jsonb
  )
on conflict (id) do update set
  rule_id = excluded.rule_id,
  well_id = excluded.well_id,
  node_id = excluded.node_id,
  metric = excluded.metric,
  severity = excluded.severity,
  message_key = excluded.message_key,
  details = excluded.details;

with sample_profiles as (
  select profile.id as profile_id, profile.phone
  from public.profiles
  as profile
)
insert into public.notification_prefs (id, profile_id, channel, enabled, destination)
select
  md5('notification-' || sample_profiles.profile_id::text)::uuid,
  sample_profiles.profile_id,
  'sms',
  true,
  substring(sample_profiles.phone, 1, 5) || '******'
from sample_profiles
on conflict (profile_id, channel) do update set
  enabled = excluded.enabled,
  destination = excluded.destination;

with sample_profiles as (
  select profile.id as profile_id, auth_user.email
  from public.profiles
  as profile
  join auth.users as auth_user on auth_user.id = profile.id
)
insert into public.api_keys (
  id, profile_id, label, key_hash, scopes, requests_per_minute, requests_per_day
)
select
  md5('api-key-' || sample_profiles.profile_id::text)::uuid,
  sample_profiles.profile_id,
  'Development fixture key',
  encode(extensions.digest(email, 'sha256'), 'hex'),
  array['wells:read'],
  60,
  1000
from sample_profiles
on conflict (id) do update set
  profile_id = excluded.profile_id,
  label = excluded.label,
  key_hash = excluded.key_hash,
  scopes = excluded.scopes,
  requests_per_minute = excluded.requests_per_minute,
  requests_per_day = excluded.requests_per_day;

insert into public.audit_log (actor_id, action, entity_type, entity_id, details)
select
  md5('platform.admin@jalmaps.test')::uuid,
  'seed_fixture',
  'phase_5_test',
  md5('seed-audit-event')::uuid,
  '{"source":"development_seed"}'::jsonb
where not exists (
  select 1
  from public.audit_log
  where entity_type = 'phase_5_test'
    and entity_id = md5('seed-audit-event')::uuid
);
