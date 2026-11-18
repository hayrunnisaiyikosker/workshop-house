import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { pool, query } from '../src/db/pool.js';
import { seed } from '../src/db/seed.js';
import { markCheckinCode } from '../src/services/attendance.js';

describe('Phase 3: QR & Code Check-in Verification', () => {
  let aliceTrainerAgent: ReturnType<typeof request.agent>;
  let bobTrainerAgent: ReturnType<typeof request.agent>;
  let aliceTrainerId: string;
  let aliceSessionId: string;
  let activeCheckinCode: string;
  let activeEnrollmentId: string;
  let cancelledCheckinCode: string;
  let bobSessionId: string;
  let bobCheckinCode: string;

  beforeAll(async () => {
    await seed();

    const trainerUser = await query<{ id: string }>(
      "SELECT id FROM users WHERE email = 'alice.trainer@workshophouse.test'"
    );
    aliceTrainerId = trainerUser.rows[0]!.id;

    // Alice near-full session (starts 3 days in future in seed)
    const aliceRes = await query<{ id: string }>(
      "SELECT s.id FROM sessions s JOIN users u ON u.id = s.trainer_id WHERE u.email = 'alice.trainer@workshophouse.test' AND s.room = 'Lab 202' LIMIT 1"
    );
    aliceSessionId = aliceRes.rows[0]!.id;

    // Active enrollment in Alice's session
    const activeRes = await query<{ id: string; checkin_code: string }>(
      "SELECT id, checkin_code FROM enrollments WHERE session_id = $1 AND status = 'active' LIMIT 1",
      [aliceSessionId]
    );
    activeEnrollmentId = activeRes.rows[0]!.id;
    activeCheckinCode = activeRes.rows[0]!.checkin_code;

    // Cancelled enrollment in Alice's session
    const cancelledRes = await query<{ checkin_code: string }>(
      "SELECT checkin_code FROM enrollments WHERE session_id = $1 AND status = 'cancelled' LIMIT 1",
      [aliceSessionId]
    );
    cancelledCheckinCode = cancelledRes.rows[0]!.checkin_code;

    // Bob session
    const bobRes = await query<{ id: string }>(
      "SELECT s.id FROM sessions s JOIN users u ON u.id = s.trainer_id WHERE u.email = 'bob.trainer@workshophouse.test' LIMIT 1"
    );
    bobSessionId = bobRes.rows[0]!.id;

    const bobEnRes = await query<{ checkin_code: string }>(
      "SELECT checkin_code FROM enrollments WHERE session_id = $1 LIMIT 1",
      [bobSessionId]
    );
    bobCheckinCode = bobEnRes.rows[0]!.checkin_code;

    // Login agents
    aliceTrainerAgent = request.agent(app);
    await aliceTrainerAgent
      .post('/auth/login')
      .send({ email: 'alice.trainer@workshophouse.test', password: 'Password123!' });

    bobTrainerAgent = request.agent(app);
    await bobTrainerAgent
      .post('/auth/login')
      .send({ email: 'bob.trainer@workshophouse.test', password: 'Password123!' });
  });

  afterAll(async () => {
    await pool.end();
  });

  it('Refuses unknown check-in code', async () => {
    const result = await markCheckinCode(
      aliceSessionId,
      'UNKNOWN99',
      aliceTrainerId,
      'trainer',
      false
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe('CODE_UNKNOWN');
      expect(result.message).toContain('unknown');
    }
  });

  it('Refuses code belonging to another session', async () => {
    const result = await markCheckinCode(
      aliceSessionId,
      bobCheckinCode,
      aliceTrainerId,
      'trainer',
      false
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe('OTHER_SESSION');
      expect(result.message).toContain('another workshop session');
    }
  });

  it('Refuses cancelled enrollment check-in', async () => {
    const result = await markCheckinCode(
      aliceSessionId,
      cancelledCheckinCode,
      aliceTrainerId,
      'trainer',
      false
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe('CANCELLED_ENROLLMENT');
      expect(result.message).toContain('cancelled');
    }
  });

  it('Refuses check-in outside the window (30 min before start until end)', async () => {
    const result = await markCheckinCode(
      aliceSessionId,
      activeCheckinCode,
      aliceTrainerId,
      'trainer',
      true // enforce window
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe('OUTSIDE_WINDOW');
      expect(result.message).toContain('outside check-in window');
    }
  });

  it('Successfully records check-in when window is open, recording method as code', async () => {
    // Create an ongoing session within the check-in window
    const courseRes = await query<{ id: string }>('SELECT id FROM courses LIMIT 1');
    const trainerRes = await query<{ id: string }>(
      "SELECT id FROM users WHERE email = 'alice.trainer@workshophouse.test'"
    );
    const learnerRes = await query<{ id: string }>(
      "SELECT id FROM users WHERE email = 'evan.learner@workshophouse.test'"
    );

    const now = new Date();
    const startsAt = new Date(now.getTime() - 10 * 60 * 1000); // started 10 mins ago
    const endsAt = new Date(now.getTime() + 60 * 60 * 1000); // ends in 1 hour

    const sessionRes = await query<{ id: string }>(
      `INSERT INTO sessions (course_id, trainer_id, starts_at, ends_at, room, capacity)
       VALUES ($1, $2, $3, $4, 'Live Lab', 10)
       RETURNING id`,
      [courseRes.rows[0]!.id, trainerRes.rows[0]!.id, startsAt, endsAt]
    );
    const liveSessionId = sessionRes.rows[0]!.id;

    const enRes = await query<{ id: string; checkin_code: string }>(
      `INSERT INTO enrollments (session_id, learner_id, status, checkin_code)
       VALUES ($1, $2, 'active', 'LIVE01')
       RETURNING id, checkin_code`,
      [liveSessionId, learnerRes.rows[0]!.id]
    );
    const liveEnrollmentId = enRes.rows[0]!.id;
    const liveCode = enRes.rows[0]!.checkin_code;

    // First check-in: must succeed
    const firstCheckin = await markCheckinCode(
      liveSessionId,
      liveCode,
      trainerRes.rows[0]!.id,
      'trainer',
      true
    );
    expect(firstCheckin.success).toBe(true);

    const attRow = await query<{ status: string; method: string }>(
      'SELECT status, method FROM attendance WHERE enrollment_id = $1',
      [liveEnrollmentId]
    );
    expect(attRow.rows[0]!.status).toBe('attended');
    expect(attRow.rows[0]!.method).toBe('code');

    // Same code twice: no second record, reports already checked in
    const secondCheckin = await markCheckinCode(
      liveSessionId,
      liveCode,
      trainerRes.rows[0]!.id,
      'trainer',
      true
    );
    expect(secondCheckin.success).toBe(false);
    if (!secondCheckin.success) {
      expect(secondCheckin.reason).toBe('ALREADY_RECORDED');
    }

    // Verify exactly 1 attendance row in DB
    const attCount = await query<{ count: string }>(
      'SELECT COUNT(*) AS count FROM attendance WHERE enrollment_id = $1',
      [liveEnrollmentId]
    );
    expect(parseInt(attCount.rows[0]!.count, 10)).toBe(1);
  });

  it('Trainer terminal HTTP endpoint processes check-in code', async () => {
    // Create another session in window for HTTP test
    const courseRes = await query<{ id: string }>('SELECT id FROM courses LIMIT 1');
    const trainerRes = await query<{ id: string }>(
      "SELECT id FROM users WHERE email = 'alice.trainer@workshophouse.test'"
    );
    const learnerRes = await query<{ id: string }>(
      "SELECT id FROM users WHERE email = 'fiona.learner@workshophouse.test'"
    );

    const startsAt = new Date(Date.now() - 5 * 60 * 1000);
    const endsAt = new Date(Date.now() + 60 * 60 * 1000);

    const sRes = await query<{ id: string }>(
      `INSERT INTO sessions (course_id, trainer_id, starts_at, ends_at, room, capacity)
       VALUES ($1, $2, $3, $4, 'Terminal Room', 5)
       RETURNING id`,
      [courseRes.rows[0]!.id, trainerRes.rows[0]!.id, startsAt, endsAt]
    );
    const termSessionId = sRes.rows[0]!.id;

    await query(
      `INSERT INTO enrollments (session_id, learner_id, status, checkin_code)
       VALUES ($1, $2, 'active', 'TERM9988')`,
      [termSessionId, learnerRes.rows[0]!.id]
    );

    // Terminal view
    const viewRes = await aliceTrainerAgent.get(`/trainer/sessions/${termSessionId}/checkin`);
    expect(viewRes.status).toBe(200);
    expect(viewRes.text).toContain('id="checkin-code-input"');

    // Submit code
    const postRes = await aliceTrainerAgent
      .post(`/trainer/sessions/${termSessionId}/checkin`)
      .send({ code: 'TERM9988' });

    expect(postRes.status).toBe(302);
    expect(postRes.header.location).toBe(`/trainer/sessions/${termSessionId}/checkin`);

    // Verify attendance was recorded
    const checkAtt = await query<{ status: string }>(
      `SELECT a.status FROM attendance a
       JOIN enrollments e ON e.id = a.enrollment_id
       WHERE e.checkin_code = 'TERM9988'`
    );
    expect(checkAtt.rows[0]!.status).toBe('attended');
  });
});
