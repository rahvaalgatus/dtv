PRAGMA writable_schema = 1;

UPDATE sqlite_master SET sql = replace(
	sql,
	'FOREIGN KEY (idea_id) REFERENCES ideas (id)',
	'FOREIGN KEY (school_id, idea_id) REFERENCES ideas (school_id, id)'
)
WHERE name = 'votes';

PRAGMA writable_schema = 0;
