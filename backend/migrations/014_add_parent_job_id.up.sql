-- Add parent_job_id to generation_jobs for tracking batch completion
-- Used when approving an outline triggers generation of all lessons as child jobs

-- Add full_course to the generation_job_type enum
ALTER TYPE generation_job_type ADD VALUE IF NOT EXISTS 'full_course';

-- Add parent_job_id column to generation_jobs
ALTER TABLE generation_jobs ADD COLUMN parent_job_id UUID REFERENCES generation_jobs(id) ON DELETE SET NULL;

-- Create index for efficient child job lookups
CREATE INDEX idx_generation_jobs_parent_id ON generation_jobs(parent_job_id);
