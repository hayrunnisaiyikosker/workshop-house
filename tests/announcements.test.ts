import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { pool, query } from '../src/db/pool.js';
import { seed } from '../src/db/seed.js';

describe('Phase 3: Announcements System', () => {
  let aliceTrainerAgent: ReturnType<typeof request.agent>;
  let bobTrainerAgent: ReturnType<typeof request.agent>;
  let aliceSessionId: string;

  beforeAll(async () => {
    await seed();

    const sRes = await query<{ id: string }>(
      "SELECT s.id FROM sessions s JOIN users u ON u.id = s.trainer_id WHERE u.email = 'alice.trainer@workshophouse.test' LIMIT 1"
    );
    aliceSessionId = sRes.rows[0]!.id;

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

  it('Alice trainer can post announcement to her own session', async () => {
    const res = await aliceTrainerAgent
      .post(`/trainer/sessions/${aliceSessionId}/announcements`)
      .send({ body: 'Reminder: Please download Docker Desktop before attending.' });

    expect(res.status).toBe(302);
    expect(res.header.location).toBe(`/trainer/sessions/${aliceSessionId}/attendance`);

    const check = await query<{ body: string }>(
      'SELECT body FROM announcements WHERE session_id = $1 AND body = $2',
      [aliceSessionId, 'Reminder: Please download Docker Desktop before attending.']
    );
    expect(check.rows.length).toBe(1);
  });

  it('Bob trainer cannot post announcement to Alice session (403 Forbidden)', async () => {
    const res = await bobTrainerAgent
      .post(`/trainer/sessions/${aliceSessionId}/announcements`)
      .send({ body: 'Bob hacking announcements.' });

    expect(res.status).toBe(403);
    expect(res.text).toContain('Access Forbidden');
  });

  it('Published announcements appear on the session detail page', async () => {
    const res = await request(app).get(`/sessions/${aliceSessionId}`);
    expect(res.status).toBe(200);
    expect(res.text).toContain('Announcements');
    expect(res.text).toContain('Reminder: Please download Docker Desktop before attending.');
  });
});
