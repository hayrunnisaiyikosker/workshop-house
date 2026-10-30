import crypto from 'node:crypto';
import { getClient, query } from '../db/pool.js';

export type EnrollResult =
  | { success: true; enrollmentId: string; reactivated: boolean }
  | { success: false; reason: 'FULL' | 'ALREADY_ENROLLED' | 'NOT_FOUND'; message: string };

export type CancelResult =
  | { success: true }
  | { success: false; message: string };

export interface LearnerEnrollmentItem {
  enrollment_id: string;
  session_id: string;
  course_title: string;
  course_description: string;
  trainer_name: string;
  room: string;
  starts_at: Date;
  ends_at: Date;
  capacity: number;
  remaining_seats: number;
  status: 'active' | 'cancelled';
  enrolled_at: Date;
  cancelled_at: Date | null;
  checkin_code: string;
  resource_url: string | null;
  can_view_resource: boolean;
}

export async function enrollLearner(sessionId: string, learnerId: string): Promise<EnrollResult> {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // BR-01: Lock the session row to serialize concurrent enrollments
    const sessionRes = await client.query<{ capacity: number }>(
      'SELECT capacity FROM sessions WHERE id = $1 FOR UPDATE',
      [sessionId]
    );

    const session = sessionRes.rows[0];
    if (!session) {
      await client.query('ROLLBACK');
      return { success: false, reason: 'NOT_FOUND', message: 'Session not found.' };
    }

    // Check if learner already has an enrollment row
    const existingEnrollmentRes = await client.query<{ id: string; status: 'active' | 'cancelled' }>(
      'SELECT id, status FROM enrollments WHERE session_id = $1 AND learner_id = $2',
      [sessionId, learnerId]
    );

    const existing = existingEnrollmentRes.rows[0];
    if (existing && existing.status === 'active') {
      await client.query('ROLLBACK');
      return {
        success: false,
        reason: 'ALREADY_ENROLLED',
        message: 'You are already actively enrolled in this session.',
      };
    }

    // Count active enrollments
    const activeCountRes = await client.query<{ count: string }>(
      "SELECT COUNT(*) AS count FROM enrollments WHERE session_id = $1 AND status = 'active'",
      [sessionId]
    );
    const activeCount = parseInt(activeCountRes.rows[0]?.count || '0', 10);

    // Check if session is full
    if (activeCount >= session.capacity) {
      await client.query('ROLLBACK');
      return {
        success: false,
        reason: 'FULL',
        message: `${session.capacity} of ${session.capacity} seats taken`,
      };
    }

    // Generate cryptographically random checkin code
    const checkinCode = crypto.randomBytes(3).toString('hex').toUpperCase();

    if (existing && existing.status === 'cancelled') {
      // Re-enrollment: reactivate the old row (no second row)
      const updateRes = await client.query<{ id: string }>(
        `UPDATE enrollments 
         SET status = 'active', cancelled_at = NULL, enrolled_at = NOW(), checkin_code = $1
         WHERE id = $2
         RETURNING id`,
        [checkinCode, existing.id]
      );

      await client.query('COMMIT');
      return { success: true, enrollmentId: updateRes.rows[0]!.id, reactivated: true };
    }

    // Brand new enrollment
    const insertRes = await client.query<{ id: string }>(
      `INSERT INTO enrollments (session_id, learner_id, status, checkin_code)
       VALUES ($1, $2, 'active', $3)
       RETURNING id`,
      [sessionId, learnerId, checkinCode]
    );

    await client.query('COMMIT');
    return { success: true, enrollmentId: insertRes.rows[0]!.id, reactivated: false };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function cancelEnrollment(sessionId: string, learnerId: string): Promise<CancelResult> {
  const result = await query(
    `UPDATE enrollments
     SET status = 'cancelled', cancelled_at = NOW()
     WHERE session_id = $1 AND learner_id = $2 AND status = 'active'`,
    [sessionId, learnerId]
  );

  if ((result.rowCount ?? 0) === 0) {
    return {
      success: false,
      message: 'No active enrollment found for this session.',
    };
  }

  return { success: true };
}

export async function listLearnerEnrollments(learnerId: string): Promise<LearnerEnrollmentItem[]> {
  const sql = `
    SELECT 
      e.id AS enrollment_id,
      e.session_id,
      c.title AS course_title,
      c.description AS course_description,
      u.name AS trainer_name,
      s.room,
      s.starts_at,
      s.ends_at,
      s.capacity,
      (s.capacity - COALESCE(e_count.active_count, 0))::int AS remaining_seats,
      e.status,
      e.enrolled_at,
      e.cancelled_at,
      e.checkin_code,
      s.resource_url,
      (e.status = 'active' AND s.resource_url IS NOT NULL) AS can_view_resource
    FROM enrollments e
    JOIN sessions s ON s.id = e.session_id
    JOIN courses c ON c.id = s.course_id
    JOIN users u ON u.id = s.trainer_id
    LEFT JOIN (
      SELECT session_id, COUNT(*) AS active_count
      FROM enrollments
      WHERE status = 'active'
      GROUP BY session_id
    ) e_count ON e_count.session_id = s.id
    WHERE e.learner_id = $1
    ORDER BY s.starts_at ASC
  `;

  const result = await query<LearnerEnrollmentItem>(sql, [learnerId]);
  return result.rows;
}
