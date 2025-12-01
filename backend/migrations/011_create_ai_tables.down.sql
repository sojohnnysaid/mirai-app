-- Drop AI Generation tables and types

-- Drop RLS policies
DROP POLICY IF EXISTS course_gen_inputs_isolation ON course_generation_inputs;
DROP POLICY IF EXISTS lesson_components_isolation ON lesson_components;
DROP POLICY IF EXISTS generated_lessons_isolation ON generated_lessons;
DROP POLICY IF EXISTS outline_lessons_isolation ON outline_lessons;
DROP POLICY IF EXISTS outline_sections_isolation ON outline_sections;
DROP POLICY IF EXISTS course_outlines_isolation ON course_outlines;
DROP POLICY IF EXISTS generation_jobs_isolation ON generation_jobs;
DROP POLICY IF EXISTS tenant_ai_settings_isolation ON tenant_ai_settings;

-- Drop foreign key constraint before dropping table
ALTER TABLE generation_jobs DROP CONSTRAINT IF EXISTS fk_generation_jobs_lesson;

-- Drop tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS course_generation_inputs;
DROP TABLE IF EXISTS lesson_components;
DROP TABLE IF EXISTS generated_lessons;
DROP TABLE IF EXISTS outline_lessons;
DROP TABLE IF EXISTS outline_sections;
DROP TABLE IF EXISTS course_outlines;
DROP TABLE IF EXISTS generation_jobs;
DROP TABLE IF EXISTS tenant_ai_settings;

-- Drop enum types
DROP TYPE IF EXISTS heading_level;
DROP TYPE IF EXISTS lesson_component_type;
DROP TYPE IF EXISTS outline_approval_status;
DROP TYPE IF EXISTS generation_job_status;
DROP TYPE IF EXISTS generation_job_type;
DROP TYPE IF EXISTS ai_provider;
