-- Rollback parent_job_id migration
-- Note: Cannot remove enum values in PostgreSQL without recreating the type

DROP INDEX IF EXISTS idx_generation_jobs_parent_id;
ALTER TABLE generation_jobs DROP COLUMN IF EXISTS parent_job_id;
