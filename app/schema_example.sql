DROP TABLE IF EXISTS user;
DROP TABLE IF EXISTS annotations;
DROP TABLE IF EXISTS data;

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
  annotated TEXT
);

CREATE TABLE IF NOT EXISTS data
(
	id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
	content TEXT NOT NULL,
	context TEXT,
    meta TEXT
);

CREATE TABLE IF NOT EXISTS annotations
(
	id INTEGER NOT NULL,
	user TEXT NOT NULL,
	timestamp TIMESTAMP DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now', 'localtime')) NOT NULL,
);

CREATE TABLE IF NOT EXISTS options
(
    max_annotations INTEGER DEFAULT 99
);

INSERT INTO options (max_annotations) VALUES (99);
