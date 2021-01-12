ALTER TABLE ideas ADD COLUMN image BLOB;
ALTER TABLE ideas ADD COLUMN image_type TEXT;

PRAGMA writable_schema = 1;

UPDATE sqlite_master SET sql = replace(
	sql,
	'CONSTRAINT created_at_format',
	'CONSTRAINT image_length CHECK (length(image) > 0),
	CONSTRAINT image_type_length CHECK (length(image_type) > 0),
	CONSTRAINT image_with_type CHECK ((image IS NULL) = (image_type IS NULL)),

	CONSTRAINT created_at_format'
)
WHERE name = 'ideas';

PRAGMA writable_schema = 0;
