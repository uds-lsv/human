DROP TABLE IF EXISTS user;
DROP TABLE IF EXISTS data;
DROP TABLE IF EXISTS annotations;
DROP TABLE IF EXISTS options;

CREATE TABLE IF NOT EXISTS user
(
id integer primary key autoincrement not null,
username text not null,
email text not null,
given_name text not null,
surname text not null,
password text not null,
user_type text not null,
is_approved text not null,
annotated text not null,
current_annotation integer not null default 0,
automaton blob);

CREATE TABLE IF NOT EXISTS data
(
id integer primary key autoincrement not null,
content text not null,
context text,
meta text,
annotation_count integer not null default 0);

CREATE TABLE IF NOT EXISTS annotations
(
id integer primary key autoincrement not null,
data_id integer not null,
user_id integer not null,
timestamp timestamp default (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')) not null,
timings
);

CREATE TABLE IF NOT EXISTS options 
(
max_annotations INTEGER DEFAULT -1
);
INSERT INTO options (max_annotations) VALUES (-1);
