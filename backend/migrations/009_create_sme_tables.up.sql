-- Create Subject Matter Expert (SME) tables
-- SMEs are knowledge source entities that can be global or team-scoped
-- Tasks allow delegating content gathering to team members

-- SME scope enum type
CREATE TYPE sme_scope AS ENUM ('global', 'team');

-- SME status enum type
CREATE TYPE sme_status AS ENUM ('draft', 'ingesting', 'active', 'archived');

-- SME task status enum type
CREATE TYPE sme_task_status AS ENUM ('pending', 'submitted', 'processing', 'completed', 'failed', 'cancelled');

-- Content type enum for uploads
CREATE TYPE sme_content_type AS ENUM ('document', 'image', 'video', 'audio', 'url', 'text');

-- Subject Matter Experts table
CREATE TABLE subject_matter_experts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    description TEXT,
    domain VARCHAR(255) NOT NULL,  -- Knowledge domain (e.g., "Sales Training")

    scope sme_scope NOT NULL DEFAULT 'global',

    status sme_status NOT NULL DEFAULT 'draft',

    -- Distilled knowledge storage
    knowledge_summary TEXT,                     -- AI-generated summary
    knowledge_content_path VARCHAR(500),        -- S3 path to full distilled knowledge JSON

    created_by_user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sme_tenant ON subject_matter_experts(tenant_id);
CREATE INDEX idx_sme_company ON subject_matter_experts(company_id);
CREATE INDEX idx_sme_scope ON subject_matter_experts(scope);
CREATE INDEX idx_sme_status ON subject_matter_experts(status);
CREATE INDEX idx_sme_created_by ON subject_matter_experts(created_by_user_id);

-- SME team access (for team-scoped SMEs)
CREATE TABLE sme_team_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sme_id UUID NOT NULL REFERENCES subject_matter_experts(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(sme_id, team_id)
);

CREATE INDEX idx_sme_team_access_tenant ON sme_team_access(tenant_id);
CREATE INDEX idx_sme_team_access_sme ON sme_team_access(sme_id);
CREATE INDEX idx_sme_team_access_team ON sme_team_access(team_id);

-- SME Tasks table (delegated content gathering)
CREATE TABLE sme_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sme_id UUID NOT NULL REFERENCES subject_matter_experts(id) ON DELETE CASCADE,

    title VARCHAR(500) NOT NULL,
    description TEXT,                           -- What content is being requested
    expected_content_type sme_content_type,     -- Hint for what to upload

    -- Assignment
    assigned_to_user_id UUID NOT NULL REFERENCES users(id),
    assigned_by_user_id UUID NOT NULL REFERENCES users(id),
    team_id UUID REFERENCES teams(id),          -- Team context

    status sme_task_status NOT NULL DEFAULT 'pending',

    -- Deadline
    due_date TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_sme_tasks_tenant ON sme_tasks(tenant_id);
CREATE INDEX idx_sme_tasks_sme ON sme_tasks(sme_id);
CREATE INDEX idx_sme_tasks_assigned_to ON sme_tasks(assigned_to_user_id);
CREATE INDEX idx_sme_tasks_assigned_by ON sme_tasks(assigned_by_user_id);
CREATE INDEX idx_sme_tasks_status ON sme_tasks(status);
CREATE INDEX idx_sme_tasks_due_date ON sme_tasks(due_date) WHERE due_date IS NOT NULL;

-- SME Task Submissions table (uploaded content)
CREATE TABLE sme_task_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES sme_tasks(id) ON DELETE CASCADE,

    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,            -- S3 path
    content_type sme_content_type NOT NULL,
    file_size_bytes BIGINT NOT NULL,

    -- Ingestion results
    extracted_text TEXT,                        -- Raw extracted text
    ai_summary TEXT,                            -- Gemini-generated summary
    ingestion_error TEXT,                       -- Error if failed

    submitted_by_user_id UUID NOT NULL REFERENCES users(id),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

CREATE INDEX idx_sme_submissions_tenant ON sme_task_submissions(tenant_id);
CREATE INDEX idx_sme_submissions_task ON sme_task_submissions(task_id);
CREATE INDEX idx_sme_submissions_submitted_by ON sme_task_submissions(submitted_by_user_id);

-- SME Knowledge Chunks table (distilled knowledge units)
CREATE TABLE sme_knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sme_id UUID NOT NULL REFERENCES subject_matter_experts(id) ON DELETE CASCADE,
    submission_id UUID REFERENCES sme_task_submissions(id) ON DELETE SET NULL,

    content TEXT NOT NULL,                      -- The knowledge text
    topic VARCHAR(255) NOT NULL,                -- Categorized topic
    keywords TEXT[],                            -- Extracted keywords
    relevance_score REAL NOT NULL DEFAULT 0.5,  -- For ranking in generation

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sme_chunks_tenant ON sme_knowledge_chunks(tenant_id);
CREATE INDEX idx_sme_chunks_sme ON sme_knowledge_chunks(sme_id);
CREATE INDEX idx_sme_chunks_submission ON sme_knowledge_chunks(submission_id);
CREATE INDEX idx_sme_chunks_topic ON sme_knowledge_chunks(topic);
CREATE INDEX idx_sme_chunks_relevance ON sme_knowledge_chunks(relevance_score);

-- Enable RLS on all SME tables
ALTER TABLE subject_matter_experts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sme_team_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE sme_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sme_task_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sme_knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY sme_isolation ON subject_matter_experts
    FOR ALL
    USING (tenant_id = current_tenant_id() OR is_superadmin())
    WITH CHECK (tenant_id = current_tenant_id() OR is_superadmin());

CREATE POLICY sme_team_access_isolation ON sme_team_access
    FOR ALL
    USING (tenant_id = current_tenant_id() OR is_superadmin())
    WITH CHECK (tenant_id = current_tenant_id() OR is_superadmin());

CREATE POLICY sme_tasks_isolation ON sme_tasks
    FOR ALL
    USING (tenant_id = current_tenant_id() OR is_superadmin())
    WITH CHECK (tenant_id = current_tenant_id() OR is_superadmin());

CREATE POLICY sme_submissions_isolation ON sme_task_submissions
    FOR ALL
    USING (tenant_id = current_tenant_id() OR is_superadmin())
    WITH CHECK (tenant_id = current_tenant_id() OR is_superadmin());

CREATE POLICY sme_chunks_isolation ON sme_knowledge_chunks
    FOR ALL
    USING (tenant_id = current_tenant_id() OR is_superadmin())
    WITH CHECK (tenant_id = current_tenant_id() OR is_superadmin());
