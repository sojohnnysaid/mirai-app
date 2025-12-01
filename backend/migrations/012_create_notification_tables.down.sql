-- Drop Notification tables and types

DROP FUNCTION IF EXISTS current_user_id();
DROP POLICY IF EXISTS notifications_isolation ON notifications;
DROP TABLE IF EXISTS notifications;
DROP TYPE IF EXISTS notification_priority;
DROP TYPE IF EXISTS notification_type;
