import { query } from '../db/pool.js';
import type { UserRole } from './auth.js';

export type ToggleCompletionResult =
  | { success: true; completed: boolean }
  | { success: false; reason: 'FORBIDDEN' | 'NOT_ACTIVE' | 'NOT_FOUND'; message: string };

export async function toggleCompletion(
  sessionId: string,
  enrollmentId: string,
  recordedBy: string,
  userRole: UserRole
): Promise<ToggleCompletionResult> {
  // Check session
  const sessionRes = await query<{ trainer_id: string }>(
    'SELECT trainer_id FROM sessions WHERE id = $1',
    [sessionId]
  );
  const session = sessionRes.rows[0];
  if (!session) {
    return { success: false, reason: 'NOT_FOUND', message: 'Session not found.' };
  }

  // Trainer check
  if (userRole === 'trainer' && session.trainer_id !== recordedBy) {
    return { success: false, reason: 'FORBIDDEN', message: 'You are not assigned to this session.' };
  }

  // Check enrollment
  const enRes = await query<{ status: string; session_id: string }>(
    'SELECT status, session_id FROM enrollments WHERE id = $1',
    [enrollmentId]
  );
  const enrollment = enRes.rows[0];
  if (!enrollment || enrollment.session_id !== sessionId) {
    return { success: false, reason: 'NOT_FOUND', message: 'Enrollment not found.' };
  }

  // Rule: Completion only for active enrollments
  if (enrollment.status !== 'active') {
    return {
      success: false,
      reason: 'NOT_ACTIVE',
      message: 'Cannot record completion for cancelled enrollments.',
    };
  }

  // Check existing completion
  const compRes = await query<{ id: string }>(
    'SELECT id FROM completions WHERE enrollment_id = $1',
    [enrollmentId]
  );

  if (compRes.rows[0]) {
    // Already completed -> toggle off (delete)
    await query('DELETE FROM completions WHERE enrollment_id = $1', [enrollmentId]);
    return { success: true, completed: false };
  }

  // Record completion
  await query(
    `INSERT INTO completions (enrollment_id, recorded_by, completed_at)
     VALUES ($1, $2, NOW())`,
    [enrollmentId, recordedBy]
  );

  return { success: true, completed: true };
}
