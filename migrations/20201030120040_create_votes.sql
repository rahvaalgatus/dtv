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
