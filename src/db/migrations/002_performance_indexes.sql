-- Migration 002: Performance indexes
-- attendance already has UNIQUE constraint on enrollment_id which acts as an index.
-- sessions primary key covers id. We add the following composite/covering indexes:

CREATE INDEX IF NOT EXISTS idx_enrollments_session_status
  ON enrollments (session_id, status);

CREATE INDEX IF NOT EXISTS idx_enrollments_learner_id
  ON enrollments (learner_id);

CREATE INDEX IF NOT EXISTS idx_sessions_starts_at
  ON sessions (starts_at);
