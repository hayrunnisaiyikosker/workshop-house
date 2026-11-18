import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { pool } from '../src/db/pool.js';
import { seed } from '../src/db/seed.js';

describe('Phase 3: Operational Dashboard', () => {
  let coordinatorAgent: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    await seed();

    coordinatorAgent = request.agent(app);
    await coordinatorAgent
      .post('/auth/login')
      .send({ email: 'coordinator@workshophouse.test', password: 'Password123!' });
  });

  afterAll(async () => {
    await pool.end();
  });

  it('Coordinator can access dashboard with operational metrics', async () => {
    const res = await coordinatorAgent.get('/dashboard');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Workshop Analytics & Performance Dashboard');
    expect(res.text).toContain('COURSES');
    expect(res.text).toContain('SESSIONS');
    expect(res.text).toContain('ACTIVE ENROLLMENTS');
    expect(res.text).toContain('ATTENDANCE RATE');
    expect(res.text).toContain('COMPLETIONS');
    expect(res.text).toContain('Session Performance Breakdown');
  });

  it('Unauthenticated user cannot access dashboard', async () => {
    const res = await request(app).get('/dashboard');
    expect(res.status).toBe(302);
    expect(res.header.location).toBe('/auth/login');
  });
});
