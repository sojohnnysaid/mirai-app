-- Remove composite index for course listing
DROP INDEX IF EXISTS idx_courses_tenant_user_updated;
