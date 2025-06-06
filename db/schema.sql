CREATE TABLE accounts (
	id INTEGER PRIMARY KEY NOT NULL,
	country TEXT,
	personal_id TEXT,
	name TEXT,
	official_name TEXT,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')), anonymized_at TEXT,

	CONSTRAINT name_length CHECK (length(name) > 0)
	CONSTRAINT official_name_length CHECK (length(official_name) > 0),
	CONSTRAINT country_format CHECK (country GLOB '[A-Z][A-Z]'),
	CONSTRAINT personal_id_length CHECK (length(personal_id) > 0),
	CONSTRAINT personal_id_format CHECK (personal_id NOT GLOB '*[^0-9]*'),

	CONSTRAINT created_at_format
	CHECK (created_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z'),

	CONSTRAINT anonymized_at_format CHECK (anonymized_at GLOB '*-*-*T*:*:*Z'),
	
	CONSTRAINT personal_id_xor_anonymized
	CHECK ((personal_id IS NULL) != (anonymized_at IS NULL)),

	CONSTRAINT country_and_personal_id_and_name CHECK (
		(country IS NULL) +
		(personal_id IS NULL) +
		(name IS NULL) +
		(official_name IS NULL) IN (0, 4)
	),

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
	deleted_at TEXT, last_used_on TEXT,

	FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE,

	CONSTRAINT token_sha256_length CHECK (length(token_sha256) == 32),

	CONSTRAINT created_at_format
	CHECK (created_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z'),

	CONSTRAINT last_used_on_format
	CHECK (last_used_on GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
	
	CONSTRAINT deleted_at_format
	CHECK (deleted_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z')
);
CREATE TABLE schools (
	id INTEGER PRIMARY KEY NOT NULL,
	name TEXT NOT NULL,
	description TEXT,
	background_color TEXT, foreground_color TEXT, logo BLOB, logo_type TEXT, slug TEXT NOT NULL,

	CONSTRAINT name_length CHECK (length(name) > 0),
	CONSTRAINT description_length CHECK (length(description) > 0),

	CONSTRAINT logo_length CHECK (length(logo) > 0),
	CONSTRAINT logo_type_length CHECK (length(logo_type) > 0),
	CONSTRAINT logo_with_type CHECK ((logo IS NULL) = (logo_type IS NULL))
);
CREATE TABLE voters (
	budget_id INTEGER NOT NULL,
	country TEXT NOT NULL,
	personal_id TEXT NOT NULL,

	PRIMARY KEY (budget_id, country, personal_id),
	FOREIGN KEY (budget_id) REFERENCES budgets (id),

	CONSTRAINT country_format CHECK (country GLOB '[A-Z][A-Z]'),
	CONSTRAINT personal_id_length CHECK (length(personal_id) > 0),
	CONSTRAINT personal_id_format CHECK (personal_id NOT GLOB '*[^0-9]*')
);
CREATE TABLE ideas (
	id INTEGER PRIMARY KEY NOT NULL,
	budget_id INTEGER NOT NULL,
	account_id INTEGER NOT NULL,
	title TEXT NOT NULL,
	description TEXT NOT NULL,
	author_names TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')), updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')), image BLOB, image_type TEXT, vote_count INTEGER,

	FOREIGN KEY (budget_id) REFERENCES budgets (id),
	FOREIGN KEY (account_id) REFERENCES accounts (id),

	CONSTRAINT title_length CHECK (length(title) > 0),
	CONSTRAINT description_length CHECK (length(description) > 0),
	CONSTRAINT author_names_length CHECK (length(author_names) > 0),

	CONSTRAINT image_length CHECK (length(image) > 0),
	CONSTRAINT image_type_length CHECK (length(image_type) > 0),
	CONSTRAINT image_with_type CHECK ((image IS NULL) = (image_type IS NULL)),

	CONSTRAINT vote_count_nonnegative CHECK (vote_count >= 0),
	
	CONSTRAINT created_at_format
	CHECK (created_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z'),

	CONSTRAINT updated_at_format
	CHECK (updated_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z')

);
CREATE INDEX index_ideas_on_account_id
ON ideas (account_id);
CREATE TABLE votes (
	budget_id INTEGER NOT NULL,
	idea_id INTEGER NOT NULL,
	voter_country TEXT NOT NULL,
	voter_personal_id TEXT NOT NULL,
	voter_name TEXT NOT NULL,
	method TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	token BLOB UNIQUE NOT NULL DEFAULT (randomblob(12)),
	signable TEXT NOT NULL,
	xades TEXT,

	FOREIGN KEY (budget_id) REFERENCES budgets (id),
	FOREIGN KEY (budget_id, idea_id) REFERENCES ideas (budget_id, id),

	CONSTRAINT voter_country_format CHECK (voter_country GLOB '[A-Z][A-Z]'),
	CONSTRAINT voter_personal_id_length CHECK (length(voter_personal_id) > 0),
	CONSTRAINT voter_personal_id_format
	CHECK (voter_personal_id NOT GLOB '*[^0-9]*')

	CONSTRAINT created_at_format
	CHECK (created_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z'),

	CONSTRAINT xades_length CHECK (length(xades) > 0)
	CONSTRAINT signable_length CHECK (length(signable) > 0)
);
CREATE INDEX index_votes_on_voter
ON votes (voter_country, voter_personal_id);
CREATE TABLE paper_votes (
	budget_id INTEGER NOT NULL,
	idea_id INTEGER NOT NULL,
	voter_country TEXT NOT NULL,
	voter_personal_id TEXT NOT NULL,

	FOREIGN KEY (budget_id) REFERENCES budgets (id),
	FOREIGN KEY (budget_id, idea_id) REFERENCES ideas (budget_id, id),

	CONSTRAINT voter_country_format CHECK (voter_country GLOB '[A-Z][A-Z]'),
	CONSTRAINT voter_personal_id_length CHECK (length(voter_personal_id) > 0),
	CONSTRAINT voter_personal_id_format
	CHECK (voter_personal_id NOT GLOB '*[^0-9]*')
);
CREATE TABLE budgets (
	id INTEGER PRIMARY KEY NOT NULL,
	school_id INTEGER NOT NULL,
	title TEXT NOT NULL,
	description TEXT,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	voting_starts_at TEXT,
	voting_ends_at TEXT, expired_at TEXT, anonymized_at TEXT,

	FOREIGN KEY (school_id) REFERENCES schools (id),

	CONSTRAINT title_length CHECK (length(title) > 0),
	CONSTRAINT description_length CHECK (length(description) > 0),

	CONSTRAINT created_at_format
	CHECK (created_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z'),

	CONSTRAINT expired_at_format CHECK (expired_at GLOB '*-*-*T*:*:*Z'),
	CONSTRAINT anonymized_at_format CHECK (anonymized_at GLOB '*-*-*T*:*:*Z'),

	CONSTRAINT expired_if_anonymized
	CHECK (anonymized_at IS NULL OR expired_at IS NOT NULL),

	CONSTRAINT voting_starts_at_format
	CHECK (voting_starts_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z'),

	CONSTRAINT voting_ends_at_format
	CHECK (voting_ends_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z')
);
CREATE UNIQUE INDEX index_votes_on_budget_and_voter
ON votes (budget_id, voter_country, voter_personal_id);
CREATE INDEX index_budgets_on_school
ON budgets (school_id, id);
CREATE UNIQUE INDEX index_ideas_on_budget_and_id
ON ideas (budget_id, id);
CREATE UNIQUE INDEX index_paper_votes_on_budget_and_voter
ON paper_votes (budget_id, voter_country, voter_personal_id);
CREATE TABLE IF NOT EXISTS "teachers" (
	school_id INTEGER NOT NULL,
	country TEXT NOT NULL,
	personal_id TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

	PRIMARY KEY (school_id, country, personal_id),
	FOREIGN KEY (school_id) REFERENCES schools (id),

	CONSTRAINT country_format CHECK (country GLOB '[A-Z][A-Z]'),
	CONSTRAINT personal_id_length CHECK (length(personal_id) > 0),
	CONSTRAINT personal_id_format CHECK (personal_id NOT GLOB '*[^0-9]*'),
	CONSTRAINT created_at_format CHECK (created_at GLOB '*-*-*T*:*:*Z')
);

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
INSERT INTO migrations VALUES('20210112171756');
INSERT INTO migrations VALUES('20210112182306');
INSERT INTO migrations VALUES('20210112185326');
INSERT INTO migrations VALUES('20210118145358');
INSERT INTO migrations VALUES('20210118155512');
INSERT INTO migrations VALUES('20221205000000');
INSERT INTO migrations VALUES('20221205000010');
INSERT INTO migrations VALUES('20240529204122');
INSERT INTO migrations VALUES('20240529224400');
INSERT INTO migrations VALUES('20240529224410');
INSERT INTO migrations VALUES('20240529224420');
INSERT INTO migrations VALUES('20240605082920');
COMMIT;
