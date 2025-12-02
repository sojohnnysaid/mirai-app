-- Revert status column addition

DROP INDEX IF EXISTS idx_audience_templates_status;

ALTER TABLE target_audience_templates
DROP COLUMN IF EXISTS status;

DROP TYPE IF EXISTS target_audience_status;
