CREATE TABLE schools (
	id INTEGER PRIMARY KEY NOT NULL,
	name TEXT NOT NULL,
	description TEXT,
	voting_starts_at TEXT,
	voting_ends_at TEXT,

	CONSTRAINT name_length CHECK (length(name) > 0),
	CONSTRAINT description_length CHECK (length(description) > 0),

	CONSTRAINT voting_starts_at_format
	CHECK (voting_starts_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z'),

	CONSTRAINT voting_ends_at_format
	CHECK (voting_ends_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z')
);
