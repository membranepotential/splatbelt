create schema if not exists api;
create table if not exists api.projects (
  id serial primary key,
  created timestamp default now(),
  updated timestamp default now(),
  name text not null,
  uploads json not null default '[]'::json,
  models json not null default '[]'::json
);
