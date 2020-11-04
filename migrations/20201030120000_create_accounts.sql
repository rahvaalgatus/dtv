CREATE TABLE accounts (
	id INTEGER PRIMARY KEY NOT NULL,
	country TEXT NOT NULL,
	personal_id TEXT NOT NULL,
	name TEXT NOT NULL,
	official_name TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

	CONSTRAINT name_length CHECK (length(name) > 0)
	CONSTRAINT official_name_length CHECK (length(official_name) > 0),
	CONSTRAINT country_format CHECK (country GLOB '[A-Z][A-Z]'),
	CONSTRAINT personal_id_length CHECK (length(personal_id) > 0),
	CONSTRAINT personal_id_format CHECK (personal_id NOT GLOB '*[^0-9]*'),

	CONSTRAINT created_at_format
	CHECK (created_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z'),

	CONSTRAINT updated_at_format
	CHECK (updated_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z')
);
