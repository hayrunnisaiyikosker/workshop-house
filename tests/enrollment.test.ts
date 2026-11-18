import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { pool, query } from '../src/db/pool.js';
import { seed } from '../src/db/seed.js';
import {
  enrollLearner,
  cancelEnrollment,
  generateCheckinCode,
} from '../src/services/enrollment.js';

describe('Enrollment Business Rules & Concurrency (BR-01 / NFR-03)', () => {
  beforeAll(async () => {
    await seed();
  });

  afterAll(async () => {
    await pool.end();
  });

  // ─── NFR-02: Check-in code format ───────────────────────────────────────────
  it('generateCheckinCode() produces an 8-char code from the unambiguous alphabet', () => {
    const ALPHABET = new Set('ABCDEFGHJKLMNPQRSTUVWXYZ23456789');
    for (let i = 0; i < 50; i++) {
      const code = generateCheckinCode();
      expect(code.length).toBe(8);
      for (const ch of code) {
        expect(ALPHABET.has(ch), `character ${ch} not in alphabet`).toBe(true);
      }
    }
  });

  // ─── BR-01 / Concurrency ────────────────────────────────────────────────────
  it('BR-01 / Concurrency: two simultaneous requests for the last seat -> exactly one success, one refusal', async () => {
    const courseRes = await query<{ id: string }>('SELECT id FROM courses LIMIT 1');
    const trainerRes = await query<{ id: string }>("SELECT id FROM users WHERE role = 'trainer' LIMIT 1");
    const courseId = courseRes.rows[0]!.id;
    const trainerId = trainerRes.rows[0]!.id;

    const startsAt = new Date(Date.now() + 100000000);
    const endsAt = new Date(Date.now() + 104000000);

    const sessionRes = await query<{ id: string }>(
      `INSERT INTO sessions (course_id, trainer_id, starts_at, ends_at, room, capacity)
       VALUES ($1, $2, $3, $4, 'Contested Room', 1)
       RETURNING id`,
      [courseId, trainerId, startsAt, endsAt]
    );
    const testSessionId = sessionRes.rows[0]!.id;

    const learnersRes = await query<{ id: string; email: string }>(
      "SELECT id, email FROM users WHERE role = 'learner' ORDER BY email ASC LIMIT 2"
    );
    const learner1 = learnersRes.rows[0]!;
    const learner2 = learnersRes.rows[1]!;

    const [result1, result2] = await Promise.all([
      enrollLearner(testSessionId, learner1.id),
      enrollLearner(testSessionId, learner2.id),
    ]);

    const successes = [result1, result2].filter((r) => r.success);
    const failures = [result1, result2].filter((r) => !r.success);

    expect(successes.length).toBe(1);
    expect(failures.length).toBe(1);

    const failure = failures[0]!;
    if (!failure.success) {
      expect(failure.reason).toBe('FULL');
    }

    const countCheck = await query<{ count: string }>(
      "SELECT COUNT(*) AS count FROM enrollments WHERE session_id = $1 AND status = 'active'",
      [testSessionId]
    );
    expect(parseInt(countCheck.rows[0]!.count, 10)).toBe(1);
  });

  // ─── Duplicate enrollment ────────────────────────────────────────────────────
  it('refuses duplicate enrollment when user is already actively enrolled', async () => {
    // Must be a future session so SESSION_STARTED guard doesn't fire first
    const sessionRes = await query<{ id: string }>(
      "SELECT id FROM sessions WHERE capacity > 5 AND starts_at > NOW() LIMIT 1"
    );
    const learnerRes = await query<{ id: string }>("SELECT id FROM users WHERE role = 'learner' LIMIT 1");
    const sessionId = sessionRes.rows[0]!.id;
    const learnerId = learnerRes.rows[0]!.id;

    await enrollLearner(sessionId, learnerId);

    const secondTry = await enrollLearner(sessionId, learnerId);
    expect(secondTry.success).toBe(false);
    if (!secondTry.success) {
      expect(secondTry.reason).toBe('ALREADY_ENROLLED');
    }
  });

  // ─── Cancel + re-enroll (FR-11) ─────────────────────────────────────────────
  it('cancelling frees the seat and re-enrolling reactivates the old row', async () => {
    const courseRes = await query<{ id: string }>('SELECT id FROM courses LIMIT 1');
    const trainerRes = await query<{ id: string }>("SELECT id FROM users WHERE role = 'trainer' LIMIT 1");
    const learnerRes = await query<{ id: string }>("SELECT id FROM users WHERE role = 'learner' LIMIT 1");
    const courseId = courseRes.rows[0]!.id;
    const trainerId = trainerRes.rows[0]!.id;
    const learnerId = learnerRes.rows[0]!.id;

    const sessionRes = await query<{ id: string }>(
      `INSERT INTO sessions (course_id, trainer_id, starts_at, ends_at, room, capacity)
       VALUES ($1, $2, NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days 2 hours', 'Room Reactivate', 3)
       RETURNING id`,
      [courseId, trainerId]
    );
    const sessionId = sessionRes.rows[0]!.id;

    const enrollRes = await enrollLearner(sessionId, learnerId);
    expect(enrollRes.success).toBe(true);
    const originalEnrollmentId = (enrollRes as { enrollmentId: string }).enrollmentId;

    const cancelRes = await cancelEnrollment(sessionId, learnerId);
    expect(cancelRes.success).toBe(true);

    const reEnrollRes = await enrollLearner(sessionId, learnerId);
    expect(reEnrollRes.success).toBe(true);
    if (reEnrollRes.success) {
      expect(reEnrollRes.reactivated).toBe(true);
      expect(reEnrollRes.enrollmentId).toBe(originalEnrollmentId);
    }

    const totalRows = await query<{ count: string }>(
      'SELECT COUNT(*) AS count FROM enrollments WHERE session_id = $1 AND learner_id = $2',
      [sessionId, learnerId]
    );
    expect(parseInt(totalRows.rows[0]!.count, 10)).toBe(1);
  });

  // ─── FR-07: Cannot enroll in a started session ───────────────────────────────
  it('FR-07: refuses enrollment when session has already started', async () => {
    const courseRes = await query<{ id: string }>('SELECT id FROM courses LIMIT 1');
    const trainerRes = await query<{ id: string }>("SELECT id FROM users WHERE role = 'trainer' LIMIT 1");
    const learnerRes = await query<{ id: string }>("SELECT id FROM users WHERE role = 'learner' LIMIT 1");

    // Insert a session that started 1 hour ago using JS Date params (not SQL NOW())
    const startedAt = new Date(Date.now() - 60 * 60 * 1000);   // 1 hour ago
    const endsAt    = new Date(Date.now() + 60 * 60 * 1000);   // 1 hour from now

    const startedRes = await query<{ id: string }>(
      `INSERT INTO sessions (course_id, trainer_id, starts_at, ends_at, room, capacity)
       VALUES ($1, $2, $3, $4, 'Started Room FR07', 10)
       RETURNING id`,
      [courseRes.rows[0]!.id, trainerRes.rows[0]!.id, startedAt, endsAt]
    );
    const startedSessionId = startedRes.rows[0]!.id;

    const result = await enrollLearner(startedSessionId, learnerRes.rows[0]!.id);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe('SESSION_STARTED');
      expect(result.message).toContain('already started');
    }
  });

  // ─── FR-10: Cannot cancel an already-started session ────────────────────────
  it('FR-10: refuses cancellation when session has already started', async () => {
    const courseRes = await query<{ id: string }>('SELECT id FROM courses LIMIT 1');
    const trainerRes = await query<{ id: string }>("SELECT id FROM users WHERE role = 'trainer' LIMIT 1");
    const learnerRes = await query<{ id: string }>("SELECT id FROM users WHERE role = 'learner' LIMIT 1");
    const learnerId = learnerRes.rows[0]!.id;

    // Session already started — use JS Date params so the guard comparison is reliable
    const startedAt = new Date(Date.now() - 30 * 60 * 1000); // 30 min ago
    const endsAt    = new Date(Date.now() + 90 * 60 * 1000); // 90 min from now

    const startedRes = await query<{ id: string }>(
      `INSERT INTO sessions (course_id, trainer_id, starts_at, ends_at, room, capacity)
       VALUES ($1, $2, $3, $4, 'Already Started FR10', 10)
       RETURNING id`,
      [courseRes.rows[0]!.id, trainerRes.rows[0]!.id, startedAt, endsAt]
    );
    const startedSessionId = startedRes.rows[0]!.id;

    // Directly insert enrollment for started session (bypassing service guard for setup)
    await query(
      `INSERT INTO enrollments (session_id, learner_id, status, checkin_code)
       VALUES ($1, $2, 'active', $3)`,
      [startedSessionId, learnerId, generateCheckinCode()]
    );

    const cancel = await cancelEnrollment(startedSessionId, learnerId);
    expect(cancel.success).toBe(false);
    expect(cancel.message).toContain('already started');
  });

  // ─── BR-08: Resource URL not exposed for cancelled enrollments ───────────────
  it('BR-08: cancelled learner does not receive resource_url from service', async () => {
    const { listLearnerEnrollments } = await import('../src/services/enrollment.js');

    // Find a learner who has a cancelled enrollment in the near-full session
    const cancelledEnrollment = await query<{ learner_id: string; session_id: string }>(
      "SELECT learner_id, session_id FROM enrollments WHERE status = 'cancelled' LIMIT 1"
    );
    if (cancelledEnrollment.rows.length === 0) return; // seed doesn't have one, skip

    const learnerId = cancelledEnrollment.rows[0]!.learner_id;
    const items = await listLearnerEnrollments(learnerId);

    const cancelled = items.filter((e) => e.status === 'cancelled');
    for (const item of cancelled) {
      expect(item.resource_url).toBeNull();
      expect(item.can_view_resource).toBe(false);
    }
  });

  // ─── BR-08: HTTP page does not render resource link for cancelled learner ────
  it('BR-08: HTTP my-sessions page hides resource link for cancelled enrollment', async () => {
    // Diana Learner has a cancelled enrollment in near-full session which has resource_url
    const agent = request.agent(app);
    await agent
      .post('/auth/login')
      .send({ email: 'diana.learner@workshophouse.test', password: 'Password123!' });

    const res = await agent.get('/my-sessions');
    expect(res.status).toBe(200);

    // The cancelled enrollment's resource URL should not appear as a link
    expect(res.text).not.toContain('https://resources.workshophouse.test/near-full');
  });

  // ─── HTTP endpoint smoke test ────────────────────────────────────────────────
  it('HTTP endpoint: learner can browse sessions, enroll, and see enrollment in my-sessions', async () => {
    const learnerAgent = request.agent(app);
    await learnerAgent
      .post('/auth/login')
      .send({ email: 'evan.learner@workshophouse.test', password: 'Password123!' });

    const sessionRes = await query<{ id: string }>('SELECT id FROM sessions WHERE capacity = 20 LIMIT 1');
    const sessionId = sessionRes.rows[0]!.id;

    const detailRes = await learnerAgent.get(`/sessions/${sessionId}`);
    expect(detailRes.status).toBe(200);

    const enrollPost = await learnerAgent.post(`/sessions/${sessionId}/enroll`);
    expect(enrollPost.status).toBe(302);
    expect(enrollPost.header.location).toBe('/my-sessions');

    const mySessionsRes = await learnerAgent.get('/my-sessions');
    expect(mySessionsRes.status).toBe(200);
    expect(mySessionsRes.text).toContain('Cancel');
  });
});
