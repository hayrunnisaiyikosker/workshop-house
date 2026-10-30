import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { pool, query } from '../src/db/pool.js';
import { seed } from '../src/db/seed.js';

describe('Database Constraints & Integrity Rules', () => {
  beforeAll(async () => {
    await seed();
  });

  afterAll(async () => {
    await pool.end();
  });

  it('enforces UNIQUE email on users', async () => {
    await expect(
      query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ('Duplicate User', 'coordinator@workshophouse.test', 'hash', 'learner')`
      )
    ).rejects.toThrow(/duplicate key value violates unique constraint/i);
  });

  it('enforces CHECK constraint on user roles (learner, trainer, coordinator)', async () => {
    await expect(
      query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ('Invalid Role', 'invalid.role@workshophouse.test', 'hash', 'superadmin')`
      )
    ).rejects.toThrow(/violates check constraint/i);
  });

  it('enforces capacity > 0 constraint on sessions', async () => {
    const courseRes = await query<{ id: string }>('SELECT id FROM courses LIMIT 1');
    const trainerRes = await query<{ id: string }>("SELECT id FROM users WHERE role = 'trainer' LIMIT 1");
    const courseId = courseRes.rows[0]!.id;
    const trainerId = trainerRes.rows[0]!.id;

    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + 3600000);

    // Capacity 0
    await expect(
      query(
        `INSERT INTO sessions (course_id, trainer_id, starts_at, ends_at, room, capacity)
         VALUES ($1, $2, $3, $4, 'Room 1', 0)`,
        [courseId, trainerId, startsAt, endsAt]
      )
    ).rejects.toThrow(/violates check constraint/i);

    // Negative capacity
    await expect(
      query(
        `INSERT INTO sessions (course_id, trainer_id, starts_at, ends_at, room, capacity)
         VALUES ($1, $2, $3, $4, 'Room 1', -5)`,
        [courseId, trainerId, startsAt, endsAt]
      )
    ).rejects.toThrow(/violates check constraint/i);
  });

  it('enforces ends_at > starts_at constraint on sessions', async () => {
    const courseRes = await query<{ id: string }>('SELECT id FROM courses LIMIT 1');
    const trainerRes = await query<{ id: string }>("SELECT id FROM users WHERE role = 'trainer' LIMIT 1");
    const courseId = courseRes.rows[0]!.id;
    const trainerId = trainerRes.rows[0]!.id;

    const startsAt = new Date();
    const endsBefore = new Date(startsAt.getTime() - 3600000); // 1 hour prior

    await expect(
      query(
        `INSERT INTO sessions (course_id, trainer_id, starts_at, ends_at, room, capacity)
         VALUES ($1, $2, $3, $4, 'Room 1', 10)`,
        [courseId, trainerId, startsAt, endsBefore]
      )
    ).rejects.toThrow(/violates check constraint "chk_ends_after_starts"/i);
  });

  it('enforces UNIQUE (session_id, learner_id) on enrollments', async () => {
    const sessionRes = await query<{ id: string }>('SELECT id FROM sessions LIMIT 1');
    const learnerRes = await query<{ id: string }>("SELECT id FROM users WHERE role = 'learner' LIMIT 1");
    const sessionId = sessionRes.rows[0]!.id;
    const learnerId = learnerRes.rows[0]!.id;

    // First ensure there is an enrollment for this pair
    await query(
      `INSERT INTO enrollments (session_id, learner_id, status, checkin_code)
       VALUES ($1, $2, 'active', 'TEST01')
       ON CONFLICT (session_id, learner_id) DO NOTHING`,
      [sessionId, learnerId]
    );

    // Attempting a second insert for same session and learner must fail
    await expect(
      query(
        `INSERT INTO enrollments (session_id, learner_id, status, checkin_code)
         VALUES ($1, $2, 'active', 'TEST02')`,
        [sessionId, learnerId]
      )
    ).rejects.toThrow(/violates unique constraint "uq_session_learner"/i);
  });

  it('enforces CHECK constraint on enrollment status (active, cancelled)', async () => {
    const sessionRes = await query<{ id: string }>('SELECT id FROM sessions LIMIT 1');
    const learnerRes = await query<{ id: string }>("SELECT id FROM users WHERE role = 'learner' LIMIT 1");
    const sessionId = sessionRes.rows[0]!.id;
    const learnerId = learnerRes.rows[0]!.id;

    await expect(
      query(
        `INSERT INTO enrollments (session_id, learner_id, status, checkin_code)
         VALUES ($1, $2, 'pending', 'TEST03')`,
        [sessionId, learnerId]
      )
    ).rejects.toThrow(/violates check constraint/i);
  });

  it('enforces UNIQUE constraint on attendance enrollment_id', async () => {
    const enRes = await query<{ id: string }>('SELECT id FROM enrollments LIMIT 1');
    const userRes = await query<{ id: string }>("SELECT id FROM users WHERE role = 'trainer' LIMIT 1");
    const enrollmentId = enRes.rows[0]!.id;
    const markedBy = userRes.rows[0]!.id;

    // Delete existing attendance if any for this enrollment
    await query('DELETE FROM attendance WHERE enrollment_id = $1', [enrollmentId]);

    // Insert first attendance
    await query(
      `INSERT INTO attendance (enrollment_id, status, method, marked_by)
       VALUES ($1, 'attended', 'manual', $2)`,
      [enrollmentId, markedBy]
    );

    // Duplicate attendance must fail
    await expect(
      query(
        `INSERT INTO attendance (enrollment_id, status, method, marked_by)
         VALUES ($1, 'attended', 'code', $2)`,
        [enrollmentId, markedBy]
      )
    ).rejects.toThrow(/violates unique constraint/i);
  });

  it('enforces UNIQUE constraint on completions enrollment_id', async () => {
    const enRes = await query<{ id: string }>('SELECT id FROM enrollments LIMIT 1');
    const userRes = await query<{ id: string }>("SELECT id FROM users WHERE role = 'trainer' LIMIT 1");
    const enrollmentId = enRes.rows[0]!.id;
    const recordedBy = userRes.rows[0]!.id;

    // Delete existing completion if any
    await query('DELETE FROM completions WHERE enrollment_id = $1', [enrollmentId]);

    // Insert first completion
    await query(
      `INSERT INTO completions (enrollment_id, recorded_by)
       VALUES ($1, $2)`,
      [enrollmentId, recordedBy]
    );

    // Duplicate completion must fail
    await expect(
      query(
        `INSERT INTO completions (enrollment_id, recorded_by)
         VALUES ($1, $2)`,
        [enrollmentId, recordedBy]
      )
    ).rejects.toThrow(/violates unique constraint/i);
  });
});
