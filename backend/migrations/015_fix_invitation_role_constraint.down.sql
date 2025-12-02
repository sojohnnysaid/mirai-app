-- Revert to migration 005 constraints
ALTER TABLE invitations DROP CONSTRAINT IF EXISTS invitation_role_check;
ALTER TABLE invitations ADD CONSTRAINT invitation_role_check
  CHECK (role IN ('admin', 'instructor', 'sme'));

ALTER TABLE users DROP CONSTRAINT IF EXISTS role_check;
ALTER TABLE users ADD CONSTRAINT role_check
  CHECK (role IN ('admin', 'instructor', 'sme'));
