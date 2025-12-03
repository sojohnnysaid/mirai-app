-- Add composite index for optimized course listing queries
-- This index supports the common pattern: list courses by tenant, optionally by user, sorted by recency

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_tenant_user_updated
ON courses(tenant_id, created_by_user_id, updated_at DESC);
