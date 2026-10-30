import { query, getClient } from '../db/pool.js';
import type { SessionInput } from '../validation/sessions.js';

export interface SessionDetail {
  id: string;
  course_id: string;
  course_title: string;
  course_description: string;
  trainer_id: string;
  trainer_name: string;
  trainer_email: string;
  starts_at: Date;
  ends_at: Date;
  room: string;
  capacity: number;
  active_enrollments: number;
  remaining_seats: number;
  resource_url: string | null;
  can_view_resource?: boolean;
  my_enrollment_status?: 'active' | 'cancelled' | null;
  my_enrollment_id?: string | null;
  my_checkin_code?: string | null;
  created_at: Date;
}

export interface TrainerOption {
  id: string;
  name: string;
  email: string;
}

export async function listTrainers(): Promise<TrainerOption[]> {
  const result = await query<TrainerOption>(
    "SELECT id, name, email FROM users WHERE role = 'trainer' ORDER BY name ASC"
  );
  return result.rows;
}

export async function listSessions(currentUserId?: string): Promise<SessionDetail[]> {
  const sql = `
    SELECT 
      s.id,
      s.course_id,
      c.title AS course_title,
      c.description AS course_description,
      s.trainer_id,
      u.name AS trainer_name,
      u.email AS trainer_email,
      s.starts_at,
      s.ends_at,
      s.room,
      s.capacity,
      COALESCE(e_count.active_count, 0)::int AS active_enrollments,
      (s.capacity - COALESCE(e_count.active_count, 0))::int AS remaining_seats,
      s.resource_url,
      s.created_at,
      my_e.status AS my_enrollment_status,
      my_e.id AS my_enrollment_id,
      my_e.checkin_code AS my_checkin_code
    FROM sessions s
    JOIN courses c ON c.id = s.course_id
    JOIN users u ON u.id = s.trainer_id
    LEFT JOIN (
      SELECT session_id, COUNT(*) AS active_count
      FROM enrollments
      WHERE status = 'active'
      GROUP BY session_id
    ) e_count ON e_count.session_id = s.id
    LEFT JOIN (
      SELECT id, session_id, status, checkin_code
      FROM enrollments
      WHERE learner_id = $1
    ) my_e ON my_e.session_id = s.id
    ORDER BY s.starts_at ASC
  `;

  const result = await query<SessionDetail>(sql, [currentUserId || null]);
  return result.rows;
}

export async function getSessionById(
  id: string,
  userId?: string,
  userRole?: string
): Promise<SessionDetail | null> {
  const sql = `
    SELECT 
      s.id,
      s.course_id,
      c.title AS course_title,
      c.description AS course_description,
      s.trainer_id,
      u.name AS trainer_name,
      u.email AS trainer_email,
      s.starts_at,
      s.ends_at,
      s.room,
      s.capacity,
      COALESCE(e_count.active_count, 0)::int AS active_enrollments,
      (s.capacity - COALESCE(e_count.active_count, 0))::int AS remaining_seats,
      s.resource_url,
      s.created_at,
      my_e.status AS my_enrollment_status,
      my_e.id AS my_enrollment_id,
      my_e.checkin_code AS my_checkin_code
    FROM sessions s
    JOIN courses c ON c.id = s.course_id
    JOIN users u ON u.id = s.trainer_id
    LEFT JOIN (
      SELECT session_id, COUNT(*) AS active_count
      FROM enrollments
      WHERE status = 'active'
      GROUP BY session_id
    ) e_count ON e_count.session_id = s.id
    LEFT JOIN (
      SELECT id, session_id, status, checkin_code
      FROM enrollments
      WHERE learner_id = $2
    ) my_e ON my_e.session_id = s.id
    WHERE s.id = $1
  `;

  const result = await query<SessionDetail>(sql, [id, userId || null]);
  const session = result.rows[0];
  if (!session) {
    return null;
  }

  // Rule: Resource link visible only to actively enrolled learners, the session's trainer, and coordinator.
  const isCoordinator = userRole === 'coordinator';
  const isSessionTrainer = userRole === 'trainer' && userId === session.trainer_id;
  const isActivelyEnrolled = session.my_enrollment_status === 'active';

  session.can_view_resource = Boolean(
    session.resource_url && (isCoordinator || isSessionTrainer || isActivelyEnrolled)
  );

  return session;
}

export async function createSession(data: SessionInput): Promise<SessionDetail> {
  const result = await query<{ id: string }>(
    `INSERT INTO sessions (course_id, trainer_id, starts_at, ends_at, room, capacity, resource_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      data.course_id,
      data.trainer_id,
      new Date(data.starts_at),
      new Date(data.ends_at),
      data.room,
      data.capacity,
      data.resource_url || null,
    ]
  );

  const newSessionId = result.rows[0]!.id;
  const fullSession = await getSessionById(newSessionId);
  return fullSession!;
}

export type UpdateSessionResult =
  | { success: true; session: SessionDetail }
  | { success: false; error: string };

export async function updateSession(id: string, data: SessionInput): Promise<UpdateSessionResult> {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Lock session row to verify current active enrollments
    const sessionRes = await client.query<{ id: string }>(
      'SELECT id FROM sessions WHERE id = $1 FOR UPDATE',
      [id]
    );
    if (!sessionRes.rows[0]) {
      await client.query('ROLLBACK');
      return { success: false, error: 'Session not found' };
    }

    // Count active enrollments
    const countRes = await client.query<{ active_count: string }>(
      "SELECT COUNT(*) AS active_count FROM enrollments WHERE session_id = $1 AND status = 'active'",
      [id]
    );
    const activeCount = parseInt(countRes.rows[0]?.active_count || '0', 10);

    // Business rule: Capacity cannot be lowered below active enrollments.
    if (data.capacity < activeCount) {
      await client.query('ROLLBACK');
      return {
        success: false,
        error: `Capacity cannot be lowered to ${data.capacity} because there are already ${activeCount} active enrollments.`,
      };
    }

    await client.query(
      `UPDATE sessions
       SET course_id = $1, trainer_id = $2, starts_at = $3, ends_at = $4, room = $5, capacity = $6, resource_url = $7
       WHERE id = $8`,
      [
        data.course_id,
        data.trainer_id,
        new Date(data.starts_at),
        new Date(data.ends_at),
        data.room,
        data.capacity,
        data.resource_url || null,
        id,
      ]
    );

    await client.query('COMMIT');

    const updated = await getSessionById(id);
    return { success: true, session: updated! };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function deleteSession(id: string): Promise<boolean> {
  const result = await query('DELETE FROM sessions WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

export type TrainerResourceResult =
  | { status: 'OK' }
  | { status: 'FORBIDDEN' }
  | { status: 'NOT_FOUND' };

export async function updateTrainerResource(
  sessionId: string,
  trainerId: string,
  resourceUrl: string | null
): Promise<TrainerResourceResult> {
  const result = await query<{ trainer_id: string }>(
    'SELECT trainer_id FROM sessions WHERE id = $1',
    [sessionId]
  );

  const session = result.rows[0];
  if (!session) {
    return { status: 'NOT_FOUND' };
  }

  // Business rule: Trainer can touch only their own sessions (resource, announcements, attendance); other -> 403.
  if (session.trainer_id !== trainerId) {
    return { status: 'FORBIDDEN' };
  }

  await query('UPDATE sessions SET resource_url = $1 WHERE id = $2', [resourceUrl, sessionId]);
  return { status: 'OK' };
}

export async function listTrainerSessions(trainerId: string): Promise<SessionDetail[]> {
  const sql = `
    SELECT 
      s.id,
      s.course_id,
      c.title AS course_title,
      c.description AS course_description,
      s.trainer_id,
      u.name AS trainer_name,
      u.email AS trainer_email,
      s.starts_at,
      s.ends_at,
      s.room,
      s.capacity,
      COALESCE(e_count.active_count, 0)::int AS active_enrollments,
      (s.capacity - COALESCE(e_count.active_count, 0))::int AS remaining_seats,
      s.resource_url,
      s.created_at
    FROM sessions s
    JOIN courses c ON c.id = s.course_id
    JOIN users u ON u.id = s.trainer_id
    LEFT JOIN (
      SELECT session_id, COUNT(*) AS active_count
      FROM enrollments
      WHERE status = 'active'
      GROUP BY session_id
    ) e_count ON e_count.session_id = s.id
    WHERE s.trainer_id = $1
    ORDER BY s.starts_at ASC
  `;

  const result = await query<SessionDetail>(sql, [trainerId]);
  return result.rows.map((r) => ({
    ...r,
    can_view_resource: Boolean(r.resource_url),
  }));
}
