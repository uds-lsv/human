CREATE TABLE IF NOT EXISTS user
(
id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
username TEXT NOT NULL,
email TEXT NOT NULL,
given_name TEXT NOT NULL,
surname TEXT NOT NULL,
password TEXT NOT NULL,
user_type TEXT NOT NULL,
is_approved TEXT NOT NULL,
annotated TEXT NOT NULL,
current_annotation INTEGER NOT NULL DEFAULT 0,
automaton blob);

CREATE TABLE IF NOT EXISTS data
(
id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
content TEXT NOT NULL,
context TEXT,
meta TEXT,
annotation_count INTEGER NOT NULL DEFAULT 0);

CREATE TABLE IF NOT EXISTS annotations
(
id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
data_id INTEGER NOT NULL REFERENCES data,
user_id INTEGER NOT NULL REFERENCES user,
timestamp timestamp DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')) NOT NULL,
timings
);

CREATE TABLE IF NOT EXISTS options 
(
max_annotations INTEGER DEFAULT -1
);
INSERT INTO options (max_annotations) VALUES (-1);
