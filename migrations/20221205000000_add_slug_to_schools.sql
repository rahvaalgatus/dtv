ALTER TABLE schools ADD COLUMN slug TEXT;
UPDATE schools SET slug = replace(lower(name), ' ', '-');

PRAGMA writable_schema = 1;

UPDATE sqlite_master
SET sql = replace(sql, 'slug TEXT', 'slug TEXT NOT NULL')
WHERE name = 'schools';

PRAGMA writable_schema = 0;
