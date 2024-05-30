.dbconfig defensive off

ALTER TABLE sessions ADD COLUMN last_used_on TEXT;

PRAGMA writable_schema = ON;

UPDATE sqlite_master SET sql = replace(
	sql,
	'CONSTRAINT deleted_at_format',
	'CONSTRAINT last_used_on_format
	CHECK (last_used_on GLOB ''[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]''),
	
	CONSTRAINT deleted_at_format'
)
WHERE name = 'sessions';

PRAGMA writable_schema = RESET;
