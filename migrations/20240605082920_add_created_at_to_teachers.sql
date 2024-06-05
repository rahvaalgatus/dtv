BEGIN;

CREATE TABLE teachers_new (
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

INSERT INTO teachers_new (school_id, country, personal_id)
SELECT school_id, country, personal_id FROM teachers;

DROP TABLE teachers;

ALTER TABLE teachers_new RENAME TO teachers;

COMMIT;
