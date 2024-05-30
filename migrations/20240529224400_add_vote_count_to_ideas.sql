.dbconfig defensive off

ALTER TABLE ideas ADD COLUMN vote_count INTEGER;

PRAGMA writable_schema = ON;

UPDATE sqlite_master SET sql = replace(
	sql,
	'CONSTRAINT created_at_format',
	'CONSTRAINT vote_count_nonnegative CHECK (vote_count >= 0),
	
	CONSTRAINT created_at_format'
)
WHERE name = 'ideas';

PRAGMA writable_schema = RESET;
