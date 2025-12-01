-- Create Target Audience Template tables
-- Templates are reusable learner profiles for course generation

-- Experience level enum type
CREATE TYPE experience_level AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');

-- Target audience templates table
CREATE TABLE target_audience_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Profile attributes
    role VARCHAR(255),                          -- Job role (e.g., "Sales Representative")
    experience_level experience_level NOT NULL DEFAULT 'intermediate',
    learning_goals TEXT[],                      -- What they want to achieve
    prerequisites TEXT[],                       -- Required prior knowledge
    challenges TEXT[],                          -- Pain points they face
    motivations TEXT[],                         -- Why they need to learn

    industry_context TEXT,                      -- Industry-specific context
    typical_background TEXT,                    -- Background description

    created_by_user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audience_templates_tenant ON target_audience_templates(tenant_id);
CREATE INDEX idx_audience_templates_company ON target_audience_templates(company_id);
CREATE INDEX idx_audience_templates_experience ON target_audience_templates(experience_level);
CREATE INDEX idx_audience_templates_created_by ON target_audience_templates(created_by_user_id);

-- Enable RLS
ALTER TABLE target_audience_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY audience_templates_isolation ON target_audience_templates
    FOR ALL
    USING (tenant_id = current_tenant_id() OR is_superadmin())
    WITH CHECK (tenant_id = current_tenant_id() OR is_superadmin());
