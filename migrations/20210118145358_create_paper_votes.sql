CREATE UNIQUE INDEX index_ideas_on_school_id_and_id
ON ideas (school_id, id);

DROP INDEX index_ideas_on_school_id;

CREATE TABLE paper_votes (
	school_id INTEGER NOT NULL,
	idea_id INTEGER NOT NULL,
	voter_country TEXT NOT NULL,
	voter_personal_id TEXT NOT NULL,

	FOREIGN KEY (school_id) REFERENCES schools (id),
	FOREIGN KEY (school_id, idea_id) REFERENCES ideas (school_id, id),

	CONSTRAINT voter_country_format CHECK (voter_country GLOB '[A-Z][A-Z]'),
	CONSTRAINT voter_personal_id_length CHECK (length(voter_personal_id) > 0),
	CONSTRAINT voter_personal_id_format
	CHECK (voter_personal_id NOT GLOB '*[^0-9]*')
);

CREATE UNIQUE INDEX index_paper_votes_on_school_and_voter
ON paper_votes (school_id, voter_country, voter_personal_id);
