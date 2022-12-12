BEGIN;

CREATE TABLE budgets (
	id INTEGER PRIMARY KEY NOT NULL,
	school_id INTEGER NOT NULL,
	title TEXT NOT NULL,
	description TEXT,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	voting_starts_at TEXT,
	voting_ends_at TEXT,

	FOREIGN KEY (school_id) REFERENCES schools (id),

	CONSTRAINT title_length CHECK (length(title) > 0),
	CONSTRAINT description_length CHECK (length(description) > 0),

	CONSTRAINT created_at_format
	CHECK (created_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z'),

	CONSTRAINT voting_starts_at_format
	CHECK (voting_starts_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z'),

	CONSTRAINT voting_ends_at_format
	CHECK (voting_ends_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z')
);

INSERT INTO budgets (
	id,
	school_id,
	title,
	description,
	created_at,
	voting_starts_at,
	voting_ends_at
)
SELECT
	id,
	id,
	COALESCE(strftime('%Y', voting_starts_at), '2021'),
	description,
	'2021-01-01T00:00:00Z',
	voting_starts_at,
	voting_ends_at

FROM schools;

DROP INDEX index_votes_on_school_and_voter;
DROP INDEX index_ideas_on_school_id_and_id;
DROP INDEX index_paper_votes_on_school_and_voter;

PRAGMA writable_schema = 1;

UPDATE sqlite_master SET sql = replace(sql, 'school', 'budget')
WHERE name = 'voters';

UPDATE sqlite_master SET sql = replace(sql, 'school', 'budget')
WHERE name = 'votes';

UPDATE sqlite_master SET sql = replace(sql, 'school', 'budget')
WHERE name = 'paper_votes';

UPDATE sqlite_master SET sql = replace(sql, 'school', 'budget')
WHERE name = 'ideas';

UPDATE sqlite_master SET sql = replace(
	sql,
	',

	CONSTRAINT voting_starts_at_format
	CHECK (voting_starts_at GLOB ''[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z'')',
	''
)
WHERE name = 'schools';

UPDATE sqlite_master SET sql = replace(
	sql,
	',

	CONSTRAINT voting_ends_at_format
	CHECK (voting_ends_at GLOB ''[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z'')',
	''
)
WHERE name = 'schools';

PRAGMA writable_schema = RESET;

ALTER TABLE schools DROP COLUMN voting_starts_at;
ALTER TABLE schools DROP COLUMN voting_ends_at;

CREATE UNIQUE INDEX index_votes_on_budget_and_voter
ON votes (budget_id, voter_country, voter_personal_id);

CREATE INDEX index_budgets_on_school
ON budgets (school_id, id);

CREATE UNIQUE INDEX index_ideas_on_budget_and_id
ON ideas (budget_id, id);

CREATE UNIQUE INDEX index_paper_votes_on_budget_and_voter
ON paper_votes (budget_id, voter_country, voter_personal_id);

COMMIT;
