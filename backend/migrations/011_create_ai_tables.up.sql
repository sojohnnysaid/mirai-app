-- Create AI Generation tables
-- Includes encrypted API key storage, generation jobs, course outlines, and generated lessons

-- AI provider enum
CREATE TYPE ai_provider AS ENUM ('gemini');

-- Generation job type enum
CREATE TYPE generation_job_type AS ENUM ('sme_ingestion', 'course_outline', 'lesson_content', 'component_regen');

-- Generation job status enum
CREATE TYPE generation_job_status AS ENUM ('queued', 'processing', 'completed', 'failed', 'cancelled');

-- Outline approval status enum
CREATE TYPE outline_approval_status AS ENUM ('pending_review', 'approved', 'rejected', 'revision_requested');

-- Lesson component type enum (MVP: text, heading, image, quiz)
CREATE TYPE lesson_component_type AS ENUM ('text', 'heading', 'image', 'quiz');

-- Heading level enum
CREATE TYPE heading_level AS ENUM ('h1', 'h2', 'h3', 'h4');

-- Tenant AI Settings table (encrypted API key storage)
-- Never expose the actual key, only api_key_configured boolean in responses
CREATE TABLE tenant_ai_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,

    provider ai_provider NOT NULL DEFAULT 'gemini',

    -- Encrypted API key (AES-256-GCM)
    -- Store as: nonce (12 bytes) || ciphertext || auth tag (16 bytes)
    encrypted_api_key BYTEA,

    -- Usage tracking
    total_tokens_used BIGINT NOT NULL DEFAULT 0,
    monthly_token_limit BIGINT,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by_user_id UUID REFERENCES users(id)
);

CREATE INDEX idx_tenant_ai_settings_tenant ON tenant_ai_settings(tenant_id);

-- Generation Jobs table (tracks all AI generation operations)
CREATE TABLE generation_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    type generation_job_type NOT NULL,
    status generation_job_status NOT NULL DEFAULT 'queued',

    -- References based on job type
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id UUID,  -- Will reference generated_lessons once created
    sme_task_id UUID REFERENCES sme_tasks(id) ON DELETE SET NULL,
    submission_id UUID REFERENCES sme_task_submissions(id) ON DELETE SET NULL,

    -- Progress tracking
    progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
    progress_message TEXT,

    -- Results
    result_path VARCHAR(500),               -- S3 path to result JSON
    error_message TEXT,

    -- Token usage for billing
    tokens_used BIGINT NOT NULL DEFAULT 0,

    -- Retry tracking
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,

    created_by_user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_generation_jobs_tenant ON generation_jobs(tenant_id);
CREATE INDEX idx_generation_jobs_type ON generation_jobs(type);
CREATE INDEX idx_generation_jobs_status ON generation_jobs(status);
CREATE INDEX idx_generation_jobs_course ON generation_jobs(course_id);
CREATE INDEX idx_generation_jobs_created_by ON generation_jobs(created_by_user_id);
CREATE INDEX idx_generation_jobs_queued ON generation_jobs(status, created_at) WHERE status = 'queued';

-- Course Outlines table (AI-generated course structure)
CREATE TABLE course_outlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

    version INTEGER NOT NULL DEFAULT 1,

    approval_status outline_approval_status NOT NULL DEFAULT 'pending_review',
    rejection_reason TEXT,

    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    approved_by_user_id UUID REFERENCES users(id)
);

CREATE INDEX idx_course_outlines_tenant ON course_outlines(tenant_id);
CREATE INDEX idx_course_outlines_course ON course_outlines(course_id);
CREATE INDEX idx_course_outlines_status ON course_outlines(approval_status);
CREATE UNIQUE INDEX idx_course_outlines_course_version ON course_outlines(course_id, version);

-- Outline Sections table (sections within an outline)
CREATE TABLE outline_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    outline_id UUID NOT NULL REFERENCES course_outlines(id) ON DELETE CASCADE,

    title VARCHAR(500) NOT NULL,
    description TEXT,
    position INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_outline_sections_tenant ON outline_sections(tenant_id);
CREATE INDEX idx_outline_sections_outline ON outline_sections(outline_id);
CREATE INDEX idx_outline_sections_position ON outline_sections(outline_id, position);

-- Outline Lessons table (lessons within a section)
CREATE TABLE outline_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES outline_sections(id) ON DELETE CASCADE,

    title VARCHAR(500) NOT NULL,
    description TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    estimated_duration_minutes INTEGER,
    learning_objectives TEXT[],

    -- Flags for segue generation
    is_last_in_section BOOLEAN NOT NULL DEFAULT FALSE,
    is_last_in_course BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_outline_lessons_tenant ON outline_lessons(tenant_id);
CREATE INDEX idx_outline_lessons_section ON outline_lessons(section_id);
CREATE INDEX idx_outline_lessons_position ON outline_lessons(section_id, position);

-- Generated Lessons table (full AI-generated lesson content)
CREATE TABLE generated_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES outline_sections(id) ON DELETE CASCADE,
    outline_lesson_id UUID NOT NULL REFERENCES outline_lessons(id) ON DELETE CASCADE,

    title VARCHAR(500) NOT NULL,

    -- Optional segue text for transition to next lesson
    segue_text TEXT,

    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_generated_lessons_tenant ON generated_lessons(tenant_id);
CREATE INDEX idx_generated_lessons_course ON generated_lessons(course_id);
CREATE INDEX idx_generated_lessons_section ON generated_lessons(section_id);
CREATE INDEX idx_generated_lessons_outline_lesson ON generated_lessons(outline_lesson_id);

-- Update the generation_jobs lesson_id foreign key
ALTER TABLE generation_jobs
    ADD CONSTRAINT fk_generation_jobs_lesson
    FOREIGN KEY (lesson_id) REFERENCES generated_lessons(id) ON DELETE SET NULL;

-- Lesson Components table (content blocks within a lesson)
CREATE TABLE lesson_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES generated_lessons(id) ON DELETE CASCADE,

    type lesson_component_type NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,

    -- Type-specific content stored as JSON for flexibility
    content_json JSONB NOT NULL,

    -- Alignment metadata - tracks what SME knowledge/objectives this supports
    sme_chunk_ids UUID[],                   -- References to sme_knowledge_chunks
    learning_objective_ids TEXT[],          -- References to outline lesson objectives

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lesson_components_tenant ON lesson_components(tenant_id);
CREATE INDEX idx_lesson_components_lesson ON lesson_components(lesson_id);
CREATE INDEX idx_lesson_components_position ON lesson_components(lesson_id, position);
CREATE INDEX idx_lesson_components_type ON lesson_components(type);

-- Course Generation Inputs table (captures inputs for AI generation)
CREATE TABLE course_generation_inputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

    -- SMEs to use as knowledge sources
    sme_ids UUID[] NOT NULL,

    -- Target audience templates
    target_audience_ids UUID[] NOT NULL,

    -- What learners should achieve
    desired_outcome TEXT NOT NULL,

    -- Extra context/instructions
    additional_context TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_course_gen_inputs_tenant ON course_generation_inputs(tenant_id);
CREATE INDEX idx_course_gen_inputs_course ON course_generation_inputs(course_id);

-- Enable RLS on all AI tables
ALTER TABLE tenant_ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_outlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE outline_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE outline_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_generation_inputs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY tenant_ai_settings_isolation ON tenant_ai_settings
    FOR ALL
    USING (tenant_id = current_tenant_id() OR is_superadmin())
    WITH CHECK (tenant_id = current_tenant_id() OR is_superadmin());

CREATE POLICY generation_jobs_isolation ON generation_jobs
    FOR ALL
    USING (tenant_id = current_tenant_id() OR is_superadmin())
    WITH CHECK (tenant_id = current_tenant_id() OR is_superadmin());

CREATE POLICY course_outlines_isolation ON course_outlines
    FOR ALL
    USING (tenant_id = current_tenant_id() OR is_superadmin())
    WITH CHECK (tenant_id = current_tenant_id() OR is_superadmin());

CREATE POLICY outline_sections_isolation ON outline_sections
    FOR ALL
    USING (tenant_id = current_tenant_id() OR is_superadmin())
    WITH CHECK (tenant_id = current_tenant_id() OR is_superadmin());

CREATE POLICY outline_lessons_isolation ON outline_lessons
    FOR ALL
    USING (tenant_id = current_tenant_id() OR is_superadmin())
    WITH CHECK (tenant_id = current_tenant_id() OR is_superadmin());

CREATE POLICY generated_lessons_isolation ON generated_lessons
    FOR ALL
    USING (tenant_id = current_tenant_id() OR is_superadmin())
    WITH CHECK (tenant_id = current_tenant_id() OR is_superadmin());

CREATE POLICY lesson_components_isolation ON lesson_components
    FOR ALL
    USING (tenant_id = current_tenant_id() OR is_superadmin())
    WITH CHECK (tenant_id = current_tenant_id() OR is_superadmin());

CREATE POLICY course_gen_inputs_isolation ON course_generation_inputs
    FOR ALL
    USING (tenant_id = current_tenant_id() OR is_superadmin())
    WITH CHECK (tenant_id = current_tenant_id() OR is_superadmin());
