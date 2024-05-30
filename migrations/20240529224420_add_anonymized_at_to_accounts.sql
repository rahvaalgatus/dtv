.dbconfig defensive off

BEGIN;

ALTER TABLE accounts ADD COLUMN anonymized_at TEXT;

PRAGMA writable_schema = ON;

UPDATE sqlite_master SET sql = replace(
	sql,
	'CONSTRAINT updated_at_format',
	'CONSTRAINT anonymized_at_format CHECK (anonymized_at GLOB ''*-*-*T*:*:*Z''),
	
	CONSTRAINT updated_at_format'
)
WHERE name = 'accounts';

UPDATE sqlite_master SET sql = replace(
	sql,
	'country TEXT NOT NULL',
	'country TEXT'
)
WHERE name = 'accounts';

UPDATE sqlite_master SET sql = replace(
	sql,
	'personal_id TEXT NOT NULL',
	'personal_id TEXT'
)
WHERE name = 'accounts';

UPDATE sqlite_master SET sql = replace(
	sql,
	'name TEXT NOT NULL',
	'name TEXT'
)
WHERE name = 'accounts';

UPDATE sqlite_master SET sql = replace(
	sql,
	'official_name TEXT NOT NULL',
	'official_name TEXT'
)
WHERE name = 'accounts';

UPDATE sqlite_master SET sql = replace(
	sql,
	'CONSTRAINT updated_at_format',
	'CONSTRAINT personal_id_xor_anonymized
	CHECK ((personal_id IS NULL) != (anonymized_at IS NULL)),

	CONSTRAINT country_and_personal_id_and_name CHECK (
		(country IS NULL) +
		(personal_id IS NULL) +
		(name IS NULL) +
		(official_name IS NULL) IN (0, 4)
	),

	CONSTRAINT updated_at_format'
)
WHERE name = 'accounts';

PRAGMA writable_schema = RESET;

END;
