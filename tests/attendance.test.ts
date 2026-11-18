import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { pool, query } from '../src/db/pool.js';
import { seed } from '../src/db/seed.js';

describe('Phase 3: Attendance & Completion Rules', () => {
  let aliceTrainerAgent: ReturnType<typeof request.agent>;
  let bobTrainerAgent: ReturnType<typeof request.agent>;
  let charlieLearnerAgent: ReturnType<typeof request.agent>;
  let aliceSessionId: string;
  let activeEnrollmentId: string;

  beforeAll(async () => {
    await seed();

    // Alice session: Near-full session in Lab 202
    const sessionRes = await query<{ id: string }>(
      "SELECT s.id FROM sessions s JOIN users u ON u.id = s.trainer_id WHERE u.email = 'alice.trainer@workshophouse.test' AND s.room = 'Lab 202' LIMIT 1"
    );
    aliceSessionId = sessionRes.rows[0]!.id;

    // Get an active enrollment in Alice's session
    const enRes = await query<{ id: string }>(
      "SELECT id FROM enrollments WHERE session_id = $1 AND status = 'active' LIMIT 1",
      [aliceSessionId]
    );
    activeEnrollmentId = enRes.rows[0]!.id;

    // Login agents
    aliceTrainerAgent = request.agent(app);
    await aliceTrainerAgent
      .post('/auth/login')
      .send({ email: 'alice.trainer@workshophouse.test', password: 'Password123!' });

    bobTrainerAgent = request.agent(app);
    await bobTrainerAgent
      .post('/auth/login')
      .send({ email: 'bob.trainer@workshophouse.test', password: 'Password123!' });

    charlieLearnerAgent = request.agent(app);
    await charlieLearnerAgent
      .post('/auth/login')
      .send({ email: 'charlie.learner@workshophouse.test', password: 'Password123!' });
  });

  afterAll(async () => {
    await pool.end();
  });

  it('Alice trainer can view attendance roster for her own session', async () => {
    const res = await aliceTrainerAgent.get(`/trainer/sessions/${aliceSessionId}/attendance`);
    expect(res.status).toBe(200);
    expect(res.text).toContain('Attendance & Completions');
    expect(res.text).toContain('Active Participant Roster');
  });

  it('Bob trainer cannot view attendance roster for Alice session (403 Forbidden)', async () => {
    const res = await bobTrainerAgent.get(`/trainer/sessions/${aliceSessionId}/attendance`);
    expect(res.status).toBe(403);
    expect(res.text).toContain('Access Forbidden');
  });

  it('Learner cannot access trainer attendance routes (403 Forbidden)', async () => {
    const res = await charlieLearnerAgent.get(`/trainer/sessions/${aliceSessionId}/attendance`);
    expect(res.status).toBe(403);
  });

  it('Alice trainer can manually mark attendance as attended and absent', async () => {
    // Mark attended
    const res1 = await aliceTrainerAgent
      .post(`/trainer/sessions/${aliceSessionId}/attendance/${activeEnrollmentId}`)
      .send({ status: 'attended' });

    expect(res1.status).toBe(302);
    expect(res1.header.location).toBe(`/trainer/sessions/${aliceSessionId}/attendance`);

    let attCheck = await query<{ status: string; method: string }>(
      'SELECT status, method FROM attendance WHERE enrollment_id = $1',
      [activeEnrollmentId]
    );
    expect(attCheck.rows[0]!.status).toBe('attended');
    expect(attCheck.rows[0]!.method).toBe('manual');

    // Mark absent
    const res2 = await aliceTrainerAgent
      .post(`/trainer/sessions/${aliceSessionId}/attendance/${activeEnrollmentId}`)
      .send({ status: 'absent' });

    expect(res2.status).toBe(302);

    attCheck = await query<{ status: string }>(
      'SELECT status FROM attendance WHERE enrollment_id = $1',
      [activeEnrollmentId]
    );
    expect(attCheck.rows[0]!.status).toBe('absent');
  });

  it('Attendance and completion are separate rows and never overwrite the enrollment table', async () => {
    const beforeEn = await query<{ status: string; checkin_code: string }>(
      'SELECT status, checkin_code FROM enrollments WHERE id = $1',
      [activeEnrollmentId]
    );

    // Mark attended
    await aliceTrainerAgent
      .post(`/trainer/sessions/${aliceSessionId}/attendance/${activeEnrollmentId}`)
      .send({ status: 'attended' });

    const afterEn = await query<{ status: string; checkin_code: string }>(
      'SELECT status, checkin_code FROM enrollments WHERE id = $1',
      [activeEnrollmentId]
    );

    // Enrollment row remains untouched
    expect(afterEn.rows[0]!.status).toBe('active');
    expect(afterEn.rows[0]!.checkin_code).toBe(beforeEn.rows[0]!.checkin_code);
  });

  it('Refuses to mark attendance for a cancelled enrollment', async () => {
    // Find cancelled enrollment in Alice's session
    const cancelledEn = await query<{ id: string }>(
      "SELECT id FROM enrollments WHERE session_id = $1 AND status = 'cancelled' LIMIT 1",
      [aliceSessionId]
    );
    expect(cancelledEn.rows.length).toBe(1);
    const cancelledId = cancelledEn.rows[0]!.id;

    const res = await aliceTrainerAgent
      .post(`/trainer/sessions/${aliceSessionId}/attendance/${cancelledId}`)
      .send({ status: 'attended' });

    expect(res.status).toBe(302);

    // Verify no attendance record was created
    const check = await query('SELECT id FROM attendance WHERE enrollment_id = $1', [cancelledId]);
    expect(check.rows.length).toBe(0);
  });

  it('Alice trainer can toggle completion for active participant', async () => {
    // 1. Toggle ON
    const res1 = await aliceTrainerAgent.post(
      `/trainer/sessions/${aliceSessionId}/completions/${activeEnrollmentId}`
    );
    expect(res1.status).toBe(302);

    let compCheck = await query('SELECT id FROM completions WHERE enrollment_id = $1', [
      activeEnrollmentId,
    ]);
    expect(compCheck.rows.length).toBe(1);

    // 2. Toggle OFF
    const res2 = await aliceTrainerAgent.post(
      `/trainer/sessions/${aliceSessionId}/completions/${activeEnrollmentId}`
    );
    expect(res2.status).toBe(302);

    compCheck = await query('SELECT id FROM completions WHERE enrollment_id = $1', [
      activeEnrollmentId,
    ]);
    expect(compCheck.rows.length).toBe(0);
  });
});
