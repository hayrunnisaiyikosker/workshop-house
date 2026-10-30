import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { pool, query } from '../src/db/pool.js';
import { seed } from '../src/db/seed.js';

describe('Session Resource Link & Trainer Boundaries', () => {
  let coordinatorAgent: ReturnType<typeof request.agent>;
  let aliceTrainerAgent: ReturnType<typeof request.agent>;
  let bobTrainerAgent: ReturnType<typeof request.agent>;
  let charlieLearnerAgent: ReturnType<typeof request.agent>;
  let fionaLearnerAgent: ReturnType<typeof request.agent>;
  let aliceSessionId: string;

  beforeAll(async () => {
    await seed();

    // Alice is trainer for course 1 / near-full session (Lab 202) where Fiona is enrolled and Charlie is not
    const aliceRes = await query<{ id: string }>(
      "SELECT s.id FROM sessions s JOIN users u ON u.id = s.trainer_id WHERE u.email = 'alice.trainer@workshophouse.test' AND s.room = 'Lab 202' LIMIT 1"
    );
    aliceSessionId = aliceRes.rows[0]!.id;

    // Login agents
    coordinatorAgent = request.agent(app);
    await coordinatorAgent
      .post('/auth/login')
      .send({ email: 'coordinator@workshophouse.test', password: 'Password123!' });

    aliceTrainerAgent = request.agent(app);
    await aliceTrainerAgent
      .post('/auth/login')
      .send({ email: 'alice.trainer@workshophouse.test', password: 'Password123!' });

    bobTrainerAgent = request.agent(app);
    await bobTrainerAgent
      .post('/auth/login')
      .send({ email: 'bob.trainer@workshophouse.test', password: 'Password123!' });

    // Fiona is actively enrolled in Alice's session
    fionaLearnerAgent = request.agent(app);
    await fionaLearnerAgent
      .post('/auth/login')
      .send({ email: 'fiona.learner@workshophouse.test', password: 'Password123!' });

    // Charlie is NOT enrolled in Alice's session
    charlieLearnerAgent = request.agent(app);
    await charlieLearnerAgent
      .post('/auth/login')
      .send({ email: 'charlie.learner@workshophouse.test', password: 'Password123!' });
  });

  afterAll(async () => {
    await pool.end();
  });

  it('Alice trainer can update resource link for her own session', async () => {
    const res = await aliceTrainerAgent
      .post(`/trainer/sessions/${aliceSessionId}/resource`)
      .send({ resource_url: 'https://workshophouse.test/alice-materials' });

    expect(res.status).toBe(302);
    expect(res.header.location).toBe('/trainer/sessions');

    const check = await query<{ resource_url: string }>(
      'SELECT resource_url FROM sessions WHERE id = $1',
      [aliceSessionId]
    );
    expect(check.rows[0]!.resource_url).toBe('https://workshophouse.test/alice-materials');
  });

  it('Bob trainer cannot update resource link for Alice session (returns 403 Forbidden)', async () => {
    const res = await bobTrainerAgent
      .post(`/trainer/sessions/${aliceSessionId}/resource`)
      .send({ resource_url: 'https://workshophouse.test/bob-hack' });

    expect(res.status).toBe(403);
    expect(res.text).toContain('Access Forbidden');
  });

  it('Resource link IS visible to coordinator', async () => {
    const res = await coordinatorAgent.get(`/sessions/${aliceSessionId}`);
    expect(res.status).toBe(200);
    expect(res.text).toContain('Access Course Materials');
    expect(res.text).toContain('https://workshophouse.test/alice-materials');
  });

  it('Resource link IS visible to the session trainer (Alice)', async () => {
    const res = await aliceTrainerAgent.get(`/sessions/${aliceSessionId}`);
    expect(res.status).toBe(200);
    expect(res.text).toContain('Access Course Materials');
    expect(res.text).toContain('https://workshophouse.test/alice-materials');
  });

  it('Resource link IS visible to actively enrolled learner (Fiona)', async () => {
    const res = await fionaLearnerAgent.get(`/sessions/${aliceSessionId}`);
    expect(res.status).toBe(200);
    expect(res.text).toContain('Access Course Materials');
    expect(res.text).toContain('https://workshophouse.test/alice-materials');
  });

  it('Resource link is NOT visible to unenrolled learner (Charlie)', async () => {
    const res = await charlieLearnerAgent.get(`/sessions/${aliceSessionId}`);
    expect(res.status).toBe(200);
    expect(res.text).not.toContain('https://workshophouse.test/alice-materials');
    expect(res.text).toContain('Course materials are restricted to actively enrolled learners');
  });

  it('Resource link is NOT visible to unauthenticated visitor', async () => {
    const res = await request(app).get(`/sessions/${aliceSessionId}`);
    expect(res.status).toBe(200);
    expect(res.text).not.toContain('https://workshophouse.test/alice-materials');
    expect(res.text).toContain('Course materials are restricted to actively enrolled learners');
  });
});
