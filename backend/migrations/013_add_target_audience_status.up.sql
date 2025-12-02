-- Add status column to target_audience_templates for soft delete/archive functionality

-- Create the enum type
CREATE TYPE target_audience_status AS ENUM ('active', 'archived');

-- Add status column with default 'active'
ALTER TABLE target_audience_templates
ADD COLUMN status target_audience_status NOT NULL DEFAULT 'active';

-- Create index for efficient filtering by status
CREATE INDEX idx_audience_templates_status ON target_audience_templates(status);
