-- Drop SME tables and types

DROP POLICY IF EXISTS sme_chunks_isolation ON sme_knowledge_chunks;
DROP POLICY IF EXISTS sme_submissions_isolation ON sme_task_submissions;
DROP POLICY IF EXISTS sme_tasks_isolation ON sme_tasks;
DROP POLICY IF EXISTS sme_team_access_isolation ON sme_team_access;
DROP POLICY IF EXISTS sme_isolation ON subject_matter_experts;

DROP TABLE IF EXISTS sme_knowledge_chunks;
DROP TABLE IF EXISTS sme_task_submissions;
DROP TABLE IF EXISTS sme_tasks;
DROP TABLE IF EXISTS sme_team_access;
DROP TABLE IF EXISTS subject_matter_experts;

DROP TYPE IF EXISTS sme_content_type;
DROP TYPE IF EXISTS sme_task_status;
DROP TYPE IF EXISTS sme_status;
DROP TYPE IF EXISTS sme_scope;
