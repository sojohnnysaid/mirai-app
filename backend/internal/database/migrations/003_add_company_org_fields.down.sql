-- Remove organization info fields from companies table
ALTER TABLE companies DROP COLUMN IF EXISTS industry;
ALTER TABLE companies DROP COLUMN IF EXISTS team_size;
