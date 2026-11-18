import { query } from '../db/pool.js';
import type { UserRole } from './auth.js';

export interface DashboardMetrics {
  totalCourses: number;
  totalSessions: number;
  totalActiveEnrollments: number;
  totalAttended: number;
  totalCompletions: number;
  attendanceRate: number; // percentage (0 - 100)
  sessions: {
    id: string;
    courseTitle: string;
    trainerName: string;
    room: string;
    startsAt: Date;
    capacity: number;
    activeCount: number;
    attendedCount: number;
    completionCount: number;
  }[];
}

export async function getDashboardMetrics(
  userId: string,
  userRole: UserRole
): Promise<DashboardMetrics> {
  const isTrainer = userRole === 'trainer';
  const filterClause = isTrainer ? 'WHERE s.trainer_id = $1' : '';
  const params = isTrainer ? [userId] : [];

  // 1. Courses count
  const courseCountRes = await query<{ count: string }>('SELECT COUNT(*) AS count FROM courses');
  const totalCourses = parseInt(courseCountRes.rows[0]?.count || '0', 10);

  // 2. Sessions list with metrics
  const sessionsRes = await query<{
    id: string;
    course_title: string;
    trainer_name: string;
    room: string;
    starts_at: Date;
    capacity: number;
    active_count: string;
    attended_count: string;
    completion_count: string;
  }>(
    `SELECT 
       s.id,
       c.title AS course_title,
       u.name AS trainer_name,
       s.room,
       s.starts_at,
       s.capacity,
       COUNT(DISTINCT CASE WHEN e.status = 'active' THEN e.id END) AS active_count,
       COUNT(DISTINCT CASE WHEN a.status = 'attended' AND e.status = 'active' THEN a.id END) AS attended_count,
       COUNT(DISTINCT CASE WHEN comp.id IS NOT NULL AND e.status = 'active' THEN comp.id END) AS completion_count
     FROM sessions s
     JOIN courses c ON c.id = s.course_id
     JOIN users u ON u.id = s.trainer_id
     LEFT JOIN enrollments e ON e.session_id = s.id
     LEFT JOIN attendance a ON a.enrollment_id = e.id
     LEFT JOIN completions comp ON comp.enrollment_id = e.id
     ${filterClause}
     GROUP BY s.id, c.title, u.name, s.room, s.starts_at, s.capacity
     ORDER BY s.starts_at DESC`,
    params
  );

  const sessions = sessionsRes.rows.map((r) => ({
    id: r.id,
    courseTitle: r.course_title,
    trainerName: r.trainer_name,
    room: r.room,
    startsAt: r.starts_at,
    capacity: r.capacity,
    activeCount: parseInt(r.active_count, 10),
    attendedCount: parseInt(r.attended_count, 10),
    completionCount: parseInt(r.completion_count, 10),
  }));

  const totalSessions = sessions.length;
  const totalActiveEnrollments = sessions.reduce((acc, s) => acc + s.activeCount, 0);
  const totalAttended = sessions.reduce((acc, s) => acc + s.attendedCount, 0);
  const totalCompletions = sessions.reduce((acc, s) => acc + s.completionCount, 0);
  const attendanceRate =
    totalActiveEnrollments > 0
      ? Math.round((totalAttended / totalActiveEnrollments) * 100)
      : 0;

  return {
    totalCourses,
    totalSessions,
    totalActiveEnrollments,
    totalAttended,
    totalCompletions,
    attendanceRate,
    sessions,
  };
}
