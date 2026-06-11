-- AYNI MVP database setup.
-- Paste and run this in Supabase SQL Editor for this project:
-- https://mcdmspplshideoslfrim.supabase.co

create extension if not exists "pgcrypto";

create table if not exists cities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamp with time zone default now()
);

create table if not exists districts (
  id uuid primary key default gen_random_uuid(),
  city_id uuid references cities(id) on delete cascade,
  name text not null,
  created_at timestamp with time zone default now()
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamp with time zone default now()
);

create table if not exists workers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  dni text not null,
  description text,
  city_id uuid references cities(id) on delete set null,
  district_id uuid references districts(id) on delete set null,
  category_id uuid references categories(id) on delete set null,
  status text default 'active',
  whatsapp_clicks integer default 0,
  created_at timestamp with time zone default now()
);

create index if not exists idx_workers_city on workers(city_id);
create index if not exists idx_workers_district on workers(district_id);
create index if not exists idx_workers_category on workers(category_id);
create index if not exists idx_workers_status on workers(status);


insert into cities (name)
values ('Cusco'), ('Arequipa')
on conflict (name) do nothing;

insert into categories (name)
values
  ('Electricista'),
  ('Gasfitero'),
  ('Tecnico de Mantenimiento'),
  ('Mecanico'),
  ('Refrigeracion'),
  ('Cerrajero'),
  ('Maestro de Obra')
on conflict (name) do nothing;

insert into districts (city_id, name)
select c.id, d.name
from cities c
cross join (
  values
    ('Cusco'),
    ('Wanchaq'),
    ('San Sebastian'),
    ('San Jeronimo'),
    ('Santiago')
) as d(name)
where c.name = 'Cusco'
and not exists (
  select 1
  from districts existing
  where existing.city_id = c.id
  and existing.name = d.name
);

insert into districts (city_id, name)
select c.id, d.name
from cities c
cross join (
  values
    ('Cercado'),
    ('Cayma'),
    ('Cerro Colorado'),
    ('Jose Luis Bustamante y Rivero'),
    ('Yanahuara'),
    ('Paucarpata')
) as d(name)
where c.name = 'Arequipa'
and not exists (
  select 1
  from districts existing
  where existing.city_id = c.id
  and existing.name = d.name
);

-- Public catalog tables are safe to expose in this MVP.
-- SQL Editor uses an admin role and can see rows even when anon cannot.
-- Disabling RLS here makes the same rows visible to the frontend anon key.
alter table cities disable row level security;
alter table districts disable row level security;
alter table categories disable row level security;
alter table workers enable row level security;

grant usage on schema public to anon, authenticated;
grant select on cities, districts, categories to anon, authenticated;
grant select, insert on workers to anon, authenticated;

drop policy if exists "Public can read cities" on cities;
create policy "Public can read cities"
on cities
for select
to anon, authenticated
using (true);

drop policy if exists "Public can read districts" on districts;
create policy "Public can read districts"
on districts
for select
to anon, authenticated
using (true);

drop policy if exists "Public can read categories" on categories;
create policy "Public can read categories"
on categories
for select
to anon, authenticated
using (true);

drop policy if exists "Public can read active workers" on workers;
create policy "Public can read active workers"
on workers
for select
to anon, authenticated
using (status = 'active');

drop policy if exists "Public can create workers" on workers;
create policy "Public can create workers"
on workers
for insert
to anon, authenticated
with check (status = 'active' or status is null);

select 'cities' as table_name, count(*) from cities
union all
select 'categories', count(*) from categories
union all
select 'districts', count(*) from districts
union all
select 'workers', count(*) from workers;

-- Frontend visibility check. These rows must be visible as anon too.
set role anon;

select 'anon cities' as table_name, count(*) from cities
union all
select 'anon categories', count(*) from categories
union all
select 'anon districts', count(*) from districts
union all
select 'anon active workers', count(*) from workers where status = 'active';

reset role;
