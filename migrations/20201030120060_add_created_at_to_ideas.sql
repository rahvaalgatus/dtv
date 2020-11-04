ALTER TABLE ideas ADD COLUMN created_at TEXT NOT NULL DEFAULT '';
ALTER TABLE ideas ADD COLUMN updated_at TEXT NOT NULL DEFAULT '';

UPDATE ideas
SET created_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE created_at = '';

UPDATE ideas
SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE updated_at = '';

PRAGMA writable_schema = 1;

UPDATE sqlite_master SET sql = replace(
	sql,
	'created_at TEXT NOT NULL DEFAULT ''''',
	'created_at TEXT NOT NULL DEFAULT (strftime(''%Y-%m-%dT%H:%M:%fZ'', ''now''))'
)
WHERE name = 'ideas';

UPDATE sqlite_master SET sql = replace(
	sql,
	'updated_at TEXT NOT NULL DEFAULT ''''',
	'updated_at TEXT NOT NULL DEFAULT (strftime(''%Y-%m-%dT%H:%M:%fZ'', ''now''))'
)
WHERE name = 'ideas';

UPDATE sqlite_master SET sql = replace(
	sql,
	'CONSTRAINT author_names_length CHECK (length(author_names) > 0)',
	'CONSTRAINT author_names_length CHECK (length(author_names) > 0),

	CONSTRAINT created_at_format
	CHECK (created_at GLOB ''[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z''),

	CONSTRAINT updated_at_format
	CHECK (updated_at GLOB ''[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z'')
')
WHERE name = 'ideas';

PRAGMA writable_schema = 0;
