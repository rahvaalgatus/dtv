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
CREATE TABLE sessions (
	id INTEGER PRIMARY KEY NOT NULL,
	account_id INTEGER NOT NULL,
  token_sha256 BLOB UNIQUE NOT NULL,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	method TEXT NOT NULL,
	created_ip TEXT,
	created_user_agent TEXT,
	deleted_at TEXT,

	FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE,

	CONSTRAINT token_sha256_length CHECK (length(token_sha256) == 32),

	CONSTRAINT created_at_format
	CHECK (created_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z'),

	CONSTRAINT deleted_at_format
	CHECK (deleted_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z')
);
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
CREATE TABLE voters (
	school_id INTEGER NOT NULL,
	country TEXT NOT NULL,
	personal_id TEXT NOT NULL,

	PRIMARY KEY (school_id, country, personal_id),
	FOREIGN KEY (school_id) REFERENCES schools (id),

	CONSTRAINT country_format CHECK (country GLOB '[A-Z][A-Z]'),
	CONSTRAINT personal_id_length CHECK (length(personal_id) > 0),
	CONSTRAINT personal_id_format CHECK (personal_id NOT GLOB '*[^0-9]*')
);
CREATE TABLE ideas (
	id INTEGER PRIMARY KEY NOT NULL,
	school_id INTEGER NOT NULL,
	account_id INTEGER NOT NULL,
	title TEXT NOT NULL,
	description TEXT NOT NULL,
	author_names TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')), updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

	FOREIGN KEY (school_id) REFERENCES schools (id),
	FOREIGN KEY (account_id) REFERENCES accounts (id),

	CONSTRAINT title_length CHECK (length(title) > 0),
	CONSTRAINT description_length CHECK (length(description) > 0),
	CONSTRAINT author_names_length CHECK (length(author_names) > 0),

	CONSTRAINT created_at_format
	CHECK (created_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z'),

	CONSTRAINT updated_at_format
	CHECK (updated_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z')

);
CREATE INDEX index_ideas_on_school_id
ON ideas (school_id);
CREATE INDEX index_ideas_on_account_id
ON ideas (account_id);
CREATE TABLE teachers (
	school_id INTEGER NOT NULL,
	country TEXT NOT NULL,
	personal_id TEXT NOT NULL,

	PRIMARY KEY (school_id, country, personal_id),
	FOREIGN KEY (school_id) REFERENCES schools (id),

	CONSTRAINT country_format CHECK (country GLOB '[A-Z][A-Z]'),
	CONSTRAINT personal_id_length CHECK (length(personal_id) > 0),
	CONSTRAINT personal_id_format CHECK (personal_id NOT GLOB '*[^0-9]*')
);
CREATE TABLE votes (
	school_id INTEGER NOT NULL,
	idea_id INTEGER NOT NULL,
	voter_country TEXT NOT NULL,
	voter_personal_id TEXT NOT NULL,
	voter_name TEXT NOT NULL,
	method TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	token BLOB UNIQUE NOT NULL DEFAULT (randomblob(12)),
	signable TEXT NOT NULL,
	xades TEXT,

	FOREIGN KEY (school_id) REFERENCES schools (id),
	FOREIGN KEY (idea_id) REFERENCES ideas (id),

	CONSTRAINT voter_country_format CHECK (voter_country GLOB '[A-Z][A-Z]'),
	CONSTRAINT voter_personal_id_length CHECK (length(voter_personal_id) > 0),
	CONSTRAINT voter_personal_id_format
	CHECK (voter_personal_id NOT GLOB '*[^0-9]*')

	CONSTRAINT created_at_format
	CHECK (created_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z'),

	CONSTRAINT xades_length CHECK (length(xades) > 0)
	CONSTRAINT signable_length CHECK (length(signable) > 0)
);
CREATE UNIQUE INDEX index_votes_on_school_and_voter
ON votes (school_id, voter_country, voter_personal_id);
CREATE INDEX index_votes_on_voter
ON votes (voter_country, voter_personal_id);

PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE migrations (version TEXT PRIMARY KEY NOT NULL);
INSERT INTO migrations VALUES('20201030120000');
INSERT INTO migrations VALUES('20201030120005');
INSERT INTO migrations VALUES('20201030120010');
INSERT INTO migrations VALUES('20201030120015');
INSERT INTO migrations VALUES('20201030120020');
INSERT INTO migrations VALUES('20201030120030');
INSERT INTO migrations VALUES('20201030120040');
INSERT INTO migrations VALUES('20201030120050');
INSERT INTO migrations VALUES('20201030120060');
COMMIT;
