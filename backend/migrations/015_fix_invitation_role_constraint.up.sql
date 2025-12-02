-- Fix invitation_role_check constraint to include valid user roles
-- SME is NOT a user role (it's an AI entity), so we exclude it
-- Include 'member' for backwards compatibility with frontend
-- Include 'owner' for backwards compatibility with legacy data

-- Update invitations table constraint
ALTER TABLE invitations DROP CONSTRAINT IF EXISTS invitation_role_check;
ALTER TABLE invitations ADD CONSTRAINT invitation_role_check
  CHECK (role IN ('owner', 'admin', 'member', 'instructor'));

-- Also update users table constraint to be consistent
ALTER TABLE users DROP CONSTRAINT IF EXISTS role_check;
ALTER TABLE users ADD CONSTRAINT role_check
  CHECK (role IN ('owner', 'admin', 'member', 'instructor'));
