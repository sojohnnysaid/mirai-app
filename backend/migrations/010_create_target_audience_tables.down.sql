-- Drop Target Audience Template tables and types

DROP POLICY IF EXISTS audience_templates_isolation ON target_audience_templates;
DROP TABLE IF EXISTS target_audience_templates;
DROP TYPE IF EXISTS experience_level;
