import { query } from '../db/pool.js';
import type { UserRole } from './auth.js';

export interface AttendanceItem {
  enrollment_id: string;
  learner_id: string;
  learner_name: string;
  learner_email: string;
  enrollment_status: 'active' | 'cancelled';
  checkin_code: string;
  attendance_status: 'attended' | 'absent' | null;
  attendance_method: 'manual' | 'code' | null;
  marked_at: Date | null;
  completed: boolean;
  completed_at: Date | null;
}

export interface SessionAttendanceData {
  sessionId: string;
  courseTitle: string;
  trainerId: string;
  trainerName: string;
  room: string;
  startsAt: Date;
  endsAt: Date;
  capacity: number;
  activeCount: number;
  attendedCount: number;
  items: AttendanceItem[];
}

export type MarkAttendanceResult =
  | { success: true }
  | { success: false; reason: 'FORBIDDEN' | 'NOT_ACTIVE' | 'NOT_FOUND'; message: string };

export type CheckinCodeResult =
  | { success: true; learnerName: string; enrollmentId: string }
  | {
      success: false;
      reason:
        | 'CODE_UNKNOWN'
        | 'OTHER_SESSION'
        | 'CANCELLED_ENROLLMENT'
        | 'OUTSIDE_WINDOW'
        | 'ALREADY_RECORDED'
        | 'FORBIDDEN';
      message: string;
      learnerName?: string;
    };

export async function getSessionAttendance(
  sessionId: string,
  userId: string,
  userRole: UserRole
): Promise<{ error?: 'FORBIDDEN' | 'NOT_FOUND'; data?: SessionAttendanceData }> {
  // Check session
  const sessionRes = await query<{
    id: string;
    course_title: string;
    trainer_id: string;
    trainer_name: string;
    room: string;
    starts_at: Date;
    ends_at: Date;
    capacity: number;
  }>(
    `SELECT s.id, c.title AS course_title, s.trainer_id, u.name AS trainer_name, s.room, s.starts_at, s.ends_at, s.capacity
     FROM sessions s
     JOIN courses c ON c.id = s.course_id
     JOIN users u ON u.id = s.trainer_id
     WHERE s.id = $1`,
    [sessionId]
  );

  const session = sessionRes.rows[0];
  if (!session) {
    return { error: 'NOT_FOUND' };
  }

  // Trainer check: Trainer can touch only their own sessions
  if (userRole === 'trainer' && session.trainer_id !== userId) {
    return { error: 'FORBIDDEN' };
  }

  // Fetch enrollments with attendance & completion
  const itemsRes = await query<AttendanceItem>(
    `SELECT 
       e.id AS enrollment_id,
       e.learner_id,
       u.name AS learner_name,
       u.email AS learner_email,
       e.status AS enrollment_status,
       e.checkin_code,
       a.status AS attendance_status,
       a.method AS attendance_method,
       a.marked_at,
       (comp.id IS NOT NULL) AS completed,
       comp.completed_at
     FROM enrollments e
     JOIN users u ON u.id = e.learner_id
     LEFT JOIN attendance a ON a.enrollment_id = e.id
     LEFT JOIN completions comp ON comp.enrollment_id = e.id
     WHERE e.session_id = $1 AND e.status = 'active'
     ORDER BY u.name ASC`,
    [sessionId]
  );

  const items = itemsRes.rows;
  const activeCount = items.length;
  const attendedCount = items.filter((i) => i.attendance_status === 'attended').length;

  return {
    data: {
      sessionId: session.id,
      courseTitle: session.course_title,
      trainerId: session.trainer_id,
      trainerName: session.trainer_name,
      room: session.room,
      startsAt: session.starts_at,
      endsAt: session.ends_at,
      capacity: session.capacity,
      activeCount,
      attendedCount,
      items,
    },
  };
}

export async function markAttendanceManual(
  sessionId: string,
  enrollmentId: string,
  status: 'attended' | 'absent',
  markedBy: string,
  userRole: UserRole
): Promise<MarkAttendanceResult> {
  // Check session & trainer ownership
  const sessionRes = await query<{ trainer_id: string }>(
    'SELECT trainer_id FROM sessions WHERE id = $1',
    [sessionId]
  );
  const session = sessionRes.rows[0];
  if (!session) {
    return { success: false, reason: 'NOT_FOUND', message: 'Session not found.' };
  }

  if (userRole === 'trainer' && session.trainer_id !== markedBy) {
    return {
      success: false,
      reason: 'FORBIDDEN',
      message: 'You are not assigned to this session.',
    };
  }

  // Check enrollment is active
  const enRes = await query<{ status: string; session_id: string }>(
    'SELECT status, session_id FROM enrollments WHERE id = $1',
    [enrollmentId]
  );
  const enrollment = enRes.rows[0];
  if (!enrollment || enrollment.session_id !== sessionId) {
    return { success: false, reason: 'NOT_FOUND', message: 'Enrollment not found.' };
  }

  // Business rule: Attendance only for active enrollments
  if (enrollment.status !== 'active') {
    return {
      success: false,
      reason: 'NOT_ACTIVE',
      message: 'Cannot record attendance for cancelled enrollments.',
    };
  }

  // Upsert attendance
  await query(
    `INSERT INTO attendance (enrollment_id, status, method, marked_by, marked_at)
     VALUES ($1, $2, 'manual', $3, NOW())
     ON CONFLICT (enrollment_id)
     DO UPDATE SET status = EXCLUDED.status, method = EXCLUDED.method, marked_by = EXCLUDED.marked_by, marked_at = NOW()`,
    [enrollmentId, status, markedBy]
  );

  return { success: true };
}

export async function markCheckinCode(
  sessionId: string,
  code: string,
  markedBy: string,
  userRole: UserRole,
  enforceWindow = true
): Promise<CheckinCodeResult> {
  const cleanCode = code.trim().toUpperCase();

  // Find enrollment by code
  const enRes = await query<{
    enrollment_id: string;
    session_id: string;
    enrollment_status: 'active' | 'cancelled';
    learner_name: string;
    starts_at: Date;
    ends_at: Date;
    trainer_id: string;
  }>(
    `SELECT 
       e.id AS enrollment_id,
       e.session_id,
       e.status AS enrollment_status,
       u.name AS learner_name,
       s.starts_at,
       s.ends_at,
       s.trainer_id
     FROM enrollments e
     JOIN sessions s ON s.id = e.session_id
     JOIN users u ON u.id = e.learner_id
     WHERE UPPER(e.checkin_code) = $1`,
    [cleanCode]
  );

  const row = enRes.rows[0];
  if (!row) {
    return {
      success: false,
      reason: 'CODE_UNKNOWN',
      message: 'Check-in code unknown.',
    };
  }

  // Check session match
  if (row.session_id !== sessionId) {
    return {
      success: false,
      reason: 'OTHER_SESSION',
      message: 'This check-in code belongs to another workshop session.',
    };
  }

  // Check trainer ownership
  if (userRole === 'trainer' && row.trainer_id !== markedBy) {
    return {
      success: false,
      reason: 'FORBIDDEN',
      message: 'You are not the assigned trainer for this session.',
    };
  }

  // Check enrollment is active
  if (row.enrollment_status === 'cancelled') {
    return {
      success: false,
      reason: 'CANCELLED_ENROLLMENT',
      message: 'Check-in refused: this enrollment has been cancelled.',
    };
  }

  // Check check-in window: 30 minutes before starts_at until ends_at
  if (enforceWindow) {
    const now = new Date();
    const windowStart = new Date(row.starts_at.getTime() - 30 * 60 * 1000); // 30 min before
    const windowEnd = row.ends_at;

    if (now < windowStart || now > windowEnd) {
      return {
        success: false,
        reason: 'OUTSIDE_WINDOW',
        message: 'Check-in refused: outside check-in window (open 30 min before start until end).',
      };
    }
  }

  // Check if already checked in: "Same code twice -> no second record"
  const existingAtt = await query<{ status: string }>(
    'SELECT status FROM attendance WHERE enrollment_id = $1',
    [row.enrollment_id]
  );
  if (existingAtt.rows[0]?.status === 'attended') {
    return {
      success: false,
      reason: 'ALREADY_RECORDED',
      message: `${row.learner_name} is already checked in.`,
      learnerName: row.learner_name,
    };
  }

  // Record attendance
  await query(
    `INSERT INTO attendance (enrollment_id, status, method, marked_by, marked_at)
     VALUES ($1, 'attended', 'code', $2, NOW())
     ON CONFLICT (enrollment_id)
     DO UPDATE SET status = 'attended', method = 'code', marked_by = EXCLUDED.marked_by, marked_at = NOW()`,
    [row.enrollment_id, markedBy]
  );

  return {
    success: true,
    learnerName: row.learner_name,
    enrollmentId: row.enrollment_id,
  };
}
