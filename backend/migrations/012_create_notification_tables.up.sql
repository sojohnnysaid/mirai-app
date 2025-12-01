-- Create Notification tables
-- In-app notifications with optional email delivery

-- Notification type enum
CREATE TYPE notification_type AS ENUM (
    'task_assigned',           -- SME task assigned to user
    'task_due_soon',           -- Task due date approaching
    'ingestion_complete',      -- SME content ingestion finished
    'ingestion_failed',        -- SME content ingestion failed
    'outline_ready',           -- Course outline generation complete
    'generation_complete',     -- Course content generation complete
    'generation_failed',       -- Course generation failed
    'approval_requested'       -- Content awaiting approval
);

-- Notification priority enum
CREATE TYPE notification_priority AS ENUM ('low', 'normal', 'high');

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    type notification_type NOT NULL,
    priority notification_priority NOT NULL DEFAULT 'normal',

    title VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,

    -- Optional references for navigation
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    job_id UUID REFERENCES generation_jobs(id) ON DELETE SET NULL,
    task_id UUID REFERENCES sme_tasks(id) ON DELETE SET NULL,
    sme_id UUID REFERENCES subject_matter_experts(id) ON DELETE SET NULL,

    -- Action URL for frontend navigation
    action_url VARCHAR(500),

    -- Status tracking
    read BOOLEAN NOT NULL DEFAULT FALSE,
    email_sent BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

CREATE INDEX idx_notifications_tenant ON notifications(tenant_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read ON notifications(user_id, read) WHERE NOT read;
CREATE INDEX idx_notifications_created ON notifications(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy - users can only see their own notifications
CREATE POLICY notifications_isolation ON notifications
    FOR ALL
    USING (
        tenant_id = current_tenant_id()
        AND user_id = current_user_id()
    ) OR is_superadmin()
    WITH CHECK (
        tenant_id = current_tenant_id()
        AND user_id = current_user_id()
    ) OR is_superadmin();

-- Create function to get current user from session
-- This should be set by the application before queries
CREATE OR REPLACE FUNCTION current_user_id() RETURNS UUID AS $$
    SELECT NULLIF(current_setting('app.user_id', TRUE), '')::UUID;
$$ LANGUAGE SQL STABLE;
