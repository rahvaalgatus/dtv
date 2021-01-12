ALTER TABLE schools ADD COLUMN logo BLOB;
ALTER TABLE schools ADD COLUMN logo_type TEXT;

PRAGMA writable_schema = 1;

UPDATE sqlite_master SET sql = replace(
	sql,
	'CONSTRAINT voting_starts_at_format',
	'CONSTRAINT logo_length CHECK (length(logo) > 0),
	CONSTRAINT logo_type_length CHECK (length(logo_type) > 0),
	CONSTRAINT logo_with_type CHECK ((logo IS NULL) = (logo_type IS NULL)),

	CONSTRAINT voting_starts_at_format'
)
WHERE name = 'schools';

PRAGMA writable_schema = 0;
