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
