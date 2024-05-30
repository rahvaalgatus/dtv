.bail ON
.dbconfig defensive off

BEGIN;
ALTER TABLE budgets ADD COLUMN expired_at TEXT;
ALTER TABLE budgets ADD COLUMN anonymized_at TEXT;

PRAGMA writable_schema = ON;

UPDATE sqlite_master SET sql = replace(
	sql,
	'CONSTRAINT voting_starts_at_format',
	'CONSTRAINT expired_at_format CHECK (expired_at GLOB ''*-*-*T*:*:*Z''),
	CONSTRAINT anonymized_at_format CHECK (anonymized_at GLOB ''*-*-*T*:*:*Z''),

	CONSTRAINT expired_if_anonymized
	CHECK (anonymized_at IS NULL OR expired_at IS NOT NULL),

	CONSTRAINT voting_starts_at_format'
)
WHERE name = 'budgets';

PRAGMA writable_schema = RESET;
END;
