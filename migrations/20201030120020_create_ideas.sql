CREATE TABLE ideas (
	id INTEGER PRIMARY KEY NOT NULL,
	school_id INTEGER NOT NULL,
	account_id INTEGER NOT NULL,
	title TEXT NOT NULL,
	description TEXT NOT NULL,
	author_names TEXT NOT NULL,

	FOREIGN KEY (school_id) REFERENCES schools (id),
	FOREIGN KEY (account_id) REFERENCES accounts (id),

	CONSTRAINT title_length CHECK (length(title) > 0),
	CONSTRAINT description_length CHECK (length(description) > 0),
	CONSTRAINT author_names_length CHECK (length(author_names) > 0)
);

CREATE INDEX index_ideas_on_school_id
ON ideas (school_id);

CREATE INDEX index_ideas_on_account_id
ON ideas (account_id);
