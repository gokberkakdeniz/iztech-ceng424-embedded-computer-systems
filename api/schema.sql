-- CREATE DATABASE AND USER
create database ceng424;

create user ceng424_admin with encrypted password 'PASSWORDHERE';

grant all privileges on database ceng424 to ceng424_admin;

-- CREATE TABLES
create table users (
  id uuid primary key,
  email varchar(256) not null,
  password varchar(256) not null
);

create table devices (
  id char(8) primary key,
  username varchar(256) not null,
  password varchar(256) not null,
  owner_id uuid not null,
  foreign key (owner_id) references users (id)
);

create table device_topics (
  device_id char(8) not null,
  topic varchar(255) not null,
  rw int not null check (
    rw between 1
    and 3
  ),
  foreign key (device_id) references devices (id)
);

create table actions (
  id uuid primary key,
  device_id char(8) not null,
  name varchar(256) not null,
  type varchar(100) not null,
  condition varchar(1000) not null,
  triggered_at timestamptz,
  wait_for bigint default 0,
  foreign key (device_id) references devices (id)
);

create table sensor_values (
  device_id char(8) not null,
  time timestamp not null,
  name varchar(256) not null,
  value real not null,
  foreign key (device_id) references devices (id)
);

select
  create_hypertable('sensor_values', 'time');

create table action_properties (
  action_id uuid not null,
  name varchar(256) not null,
  value text not null,
  foreign key (action_id) references actions (id) on delete cascade;
);

create table sensor_errors (
  device_id char(8) not null,
  time timestamp not null,
  name varchar(256) not null,
  foreign key (device_id) references devices (id)
);

select
  create_hypertable('sensor_errors', 'time');

create table device_resets (
  device_id char(8) not null,
  time timestamp not null,
  foreign key (device_id) references devices (id)
);

select
  create_hypertable('device_resets', 'time');

create table sensors (
  id bigint primary key,
  name varchar(256) not null unique,
  type varchar(8) check (type in ('analog', 'digital'))
);

create table sensor_outputs (
  id bigint primary key,
  sensor_id bigint not null,
  name varchar(256) not null,
  foreign key (sensor_id) references sensors (id),
  UNIQUE (sensor_id, name)
);

CREATE OR REPLACE FUNCTION get_last_sensor_values(dev_id char(8))
  RETURNS TABLE (name varchar(256), value float4)
  LANGUAGE plpgsql as $$
DECLARE 
	svd_count integer;
BEGIN
	DROP TABLE if exists svd;
	CREATE TEMP TABLE svd AS SELECT DISTINCT sv.name FROM sensor_values sv WHERE sv.device_id = dev_id;

	SELECT count(*) into svd_count from svd;
	
	return QUERY SELECT sv.name, sv.value
		FROM 
			sensor_values sv,
			svd
		WHERE sv.device_id = dev_id AND sv.name = svd.name ORDER BY sv.time desc limit svd_count;
	DROP TABLE if exists svd;
END;
$$;

CREATE OR REPLACE FUNCTION get_sensor_value_counts(dev_id char(8))
  RETURNS TABLE (name varchar(256), value_count bigint)
  LANGUAGE plpgsql as $$
DECLARE 
	svd_count integer;
BEGIN
	FOR sensor_name IN (SELECT DISTINCT sv.name FROM sensor_values sv WHERE sv.device_id = dev_id)
  LOOP
    RETURN QUERY SELECT name, count(*) AS value_count FROM sensor_values WHERE device_id = dev_id AND name = sensor_name;
  END LOOP;
end;
$$;

CREATE OR REPLACE FUNCTION get_sensor_value_counts(dev_id char(8))
  RETURNS TABLE (name varchar(256), value bigint)
  LANGUAGE plpgsql as $$
DECLARE 
	svd_count integer;
 	arow record;
BEGIN
  FOR arow in (SELECT DISTINCT sv.name FROM sensor_values sv WHERE sv.device_id = dev_id)
  LOOP
    RETURN QUERY SELECT sv.name, count(*) AS value FROM sensor_values sv WHERE sv.device_id = dev_id AND sv.name = arow.name GROUP BY sv.name;
  END LOOP;
end;
$$;


-- INSERT DATA
insert into
  users
values
  (
    'd3304325-24d1-4941-8c7d-c0204e3c7ec8',
    'a@a.com',
    '$2b$10$hdF6wZiPWkrIULIyTS3kbOnm0/ovrFHPWXmVndVWKI1nrYIdVvcXm' -- 123456
  ),
  (
    '6472b727-4076-46dd-ab64-2f9dab9dc176',
    'admin@ceng424.akdeniz.dev',
    '$2b$10$JmG3Vc/ni74bO.2ljgKChe7mcPPsSyM/wBfeHsx29tZhrxaUgJXx.' -- 123456
  );

insert into
  devices
values
  (
    '00A9F7DF',
    'test',
    -- 123456
    '$2b$10$/zjDnPbZlGPyVv4/bZMHYOgSXN3sjSKS6Lj8.fbtLk7.cRluJBIDO',
    'd3304325-24d1-4941-8c7d-c0204e3c7ec8'
  ),
  (
    '00000000',
    'admin',
    -- 123456
    '$2b$10$3Vemlrz/KS/Yn5zzjOpISedDoL/Pak2F70jYpAGIgLRvBMip4hs2a',
    '6472b727-4076-46dd-ab64-2f9dab9dc176'
  );

insert into
  device_topics
values
  ('00A9F7DF', '00A9F7DF/#', 3);

insert into
  sensors
values
  (1,'DHT','analog'),
  (2,'LDR','digital');

insert into
  sensor_outputs
values
  (1,1,'temperature'),
  (2,1,'humidity'),
  (3,1,'heatIndex'),
  (4,2,'voltage');
