import { query } from '../db/pool.js';
import type { UserRole } from './auth.js';

export interface AnnouncementItem {
  id: string;
  session_id: string;
  author_id: string;
  author_name: string;
  author_role: string;
  body: string;
  created_at: Date;
}

export type CreateAnnouncementResult =
  | { success: true; announcement: AnnouncementItem }
  | { success: false; reason: 'FORBIDDEN' | 'NOT_FOUND'; message: string };

export async function listAnnouncements(sessionId: string): Promise<AnnouncementItem[]> {
  const result = await query<AnnouncementItem>(
    `SELECT 
       a.id,
       a.session_id,
       a.author_id,
       u.name AS author_name,
       u.role AS author_role,
       a.body,
       a.created_at
     FROM announcements a
     JOIN users u ON u.id = a.author_id
     WHERE a.session_id = $1
     ORDER BY a.created_at DESC`,
    [sessionId]
  );
  return result.rows;
}

export async function createAnnouncement(
  sessionId: string,
  authorId: string,
  body: string,
  userRole: UserRole
): Promise<CreateAnnouncementResult> {
  const sessionRes = await query<{ trainer_id: string }>(
    'SELECT trainer_id FROM sessions WHERE id = $1',
    [sessionId]
  );
  const session = sessionRes.rows[0];
  if (!session) {
    return { success: false, reason: 'NOT_FOUND', message: 'Session not found.' };
  }

  // Trainer check: Trainer can touch only their own sessions
  if (userRole === 'trainer' && session.trainer_id !== authorId) {
    return { success: false, reason: 'FORBIDDEN', message: 'You are not assigned to this session.' };
  }

  const insertRes = await query<{ id: string; created_at: Date }>(
    `INSERT INTO announcements (session_id, author_id, body)
     VALUES ($1, $2, $3)
     RETURNING id, created_at`,
    [sessionId, authorId, body]
  );

  const authorRes = await query<{ name: string; role: string }>(
    'SELECT name, role FROM users WHERE id = $1',
    [authorId]
  );

  return {
    success: true,
    announcement: {
      id: insertRes.rows[0]!.id,
      session_id: sessionId,
      author_id: authorId,
      author_name: authorRes.rows[0]!.name,
      author_role: authorRes.rows[0]!.role,
      body,
      created_at: insertRes.rows[0]!.created_at,
    },
  };
}
