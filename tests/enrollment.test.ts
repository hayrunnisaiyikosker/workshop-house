import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { pool, query } from '../src/db/pool.js';
import { seed } from '../src/db/seed.js';
import { enrollLearner, cancelEnrollment } from '../src/services/enrollment.js';

describe('Enrollment Business Rules & Concurrency (BR-01 / NFR-03)', () => {
  beforeAll(async () => {
    await seed();
  });

  afterAll(async () => {
    await pool.end();
  });

  it('BR-01 / Concurrency: two simultaneous requests for the last seat -> exactly one success, one refusal', async () => {
    // 1. Create a dedicated session with capacity = 1
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

    // Get two distinct learners
    const learnersRes = await query<{ id: string; email: string }>(
      "SELECT id, email FROM users WHERE role = 'learner' ORDER BY email ASC LIMIT 2"
    );
    const learner1 = learnersRes.rows[0]!;
    const learner2 = learnersRes.rows[1]!;

    // 2. Fire two simultaneous requests for the 1 remaining seat
    const [result1, result2] = await Promise.all([
      enrollLearner(testSessionId, learner1.id),
      enrollLearner(testSessionId, learner2.id),
    ]);

    // 3. Exactly one must succeed, and one must be refused with reason 'FULL'
    const successes = [result1, result2].filter((r) => r.success);
    const failures = [result1, result2].filter((r) => !r.success);

    expect(successes.length).toBe(1);
    expect(failures.length).toBe(1);

    const failure = failures[0]!;
    if (!failure.success) {
      expect(failure.reason).toBe('FULL');
      expect(failure.message).toBe('1 of 1 seats taken');
    }

    // Verify in database: exactly 1 active enrollment
    const countCheck = await query<{ count: string }>(
      "SELECT COUNT(*) AS count FROM enrollments WHERE session_id = $1 AND status = 'active'",
      [testSessionId]
    );
    expect(parseInt(countCheck.rows[0]!.count, 10)).toBe(1);
  });

  it('refuses duplicate enrollment when user is already actively enrolled', async () => {
    const sessionRes = await query<{ id: string }>('SELECT id FROM sessions WHERE capacity > 5 LIMIT 1');
    const learnerRes = await query<{ id: string }>("SELECT id FROM users WHERE role = 'learner' LIMIT 1");
    const sessionId = sessionRes.rows[0]!.id;
    const learnerId = learnerRes.rows[0]!.id;

    // First enrollment
    await enrollLearner(sessionId, learnerId);

    // Second enrollment attempt for the same session and learner
    const secondTry = await enrollLearner(sessionId, learnerId);
    expect(secondTry.success).toBe(false);
    if (!secondTry.success) {
      expect(secondTry.reason).toBe('ALREADY_ENROLLED');
      expect(secondTry.message).toBe('You are already actively enrolled in this session.');
    }
  });

  it('cancelling frees the seat and re-enrolling reactivates the old row', async () => {
    // Pick or create a session
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

    // 1. Enroll learner
    const enrollRes = await enrollLearner(sessionId, learnerId);
    expect(enrollRes.success).toBe(true);
    const originalEnrollmentId = (enrollRes as { enrollmentId: string }).enrollmentId;

    // Active enrollments check: 1 active
    let countRes = await query<{ count: string }>(
      "SELECT COUNT(*) AS count FROM enrollments WHERE session_id = $1 AND status = 'active'",
      [sessionId]
    );
    expect(parseInt(countRes.rows[0]!.count, 10)).toBe(1);

    // 2. Cancel enrollment
    const cancelRes = await cancelEnrollment(sessionId, learnerId);
    expect(cancelRes.success).toBe(true);

    // Active enrollments check: 0 active (seat is freed!)
    countRes = await query<{ count: string }>(
      "SELECT COUNT(*) AS count FROM enrollments WHERE session_id = $1 AND status = 'active'",
      [sessionId]
    );
    expect(parseInt(countRes.rows[0]!.count, 10)).toBe(0);

    const cancelledRow = await query<{ status: string; cancelled_at: Date }>(
      'SELECT status, cancelled_at FROM enrollments WHERE id = $1',
      [originalEnrollmentId]
    );
    expect(cancelledRow.rows[0]!.status).toBe('cancelled');
    expect(cancelledRow.rows[0]!.cancelled_at).not.toBeNull();

    // 3. Re-enroll learner
    const reEnrollRes = await enrollLearner(sessionId, learnerId);
    expect(reEnrollRes.success).toBe(true);
    if (reEnrollRes.success) {
      expect(reEnrollRes.reactivated).toBe(true);
      expect(reEnrollRes.enrollmentId).toBe(originalEnrollmentId); // Same row!
    }

    // Verify in database that NO second row was created
    const totalRows = await query<{ count: string }>(
      'SELECT COUNT(*) AS count FROM enrollments WHERE session_id = $1 AND learner_id = $2',
      [sessionId, learnerId]
    );
    expect(parseInt(totalRows.rows[0]!.count, 10)).toBe(1);

    const reactivatedRow = await query<{ status: string; cancelled_at: Date | null }>(
      'SELECT status, cancelled_at FROM enrollments WHERE id = $1',
      [originalEnrollmentId]
    );
    expect(reactivatedRow.rows[0]!.status).toBe('active');
    expect(reactivatedRow.rows[0]!.cancelled_at).toBeNull();
  });

  it('HTTP endpoint: learner can browse sessions, enroll, and see enrollment in my-sessions', async () => {
    const learnerAgent = request.agent(app);
    await learnerAgent
      .post('/auth/login')
      .send({ email: 'evan.learner@workshophouse.test', password: 'Password123!' });

    // Find upcoming session with free seats
    const sessionRes = await query<{ id: string }>('SELECT id FROM sessions WHERE capacity = 20 LIMIT 1');
    const sessionId = sessionRes.rows[0]!.id;

    // View detail page
    const detailRes = await learnerAgent.get(`/sessions/${sessionId}`);
    expect(detailRes.status).toBe(200);
    expect(detailRes.text).toContain('Enroll in this Session');

    // POST enroll
    const enrollPost = await learnerAgent.post(`/sessions/${sessionId}/enroll`);
    expect(enrollPost.status).toBe(302);
    expect(enrollPost.header.location).toBe('/my-sessions');

    // GET my-sessions
    const mySessionsRes = await learnerAgent.get('/my-sessions');
    expect(mySessionsRes.status).toBe(200);
    expect(mySessionsRes.text).toContain('Active');
    expect(mySessionsRes.text).toContain('Cancel');
  });
});
