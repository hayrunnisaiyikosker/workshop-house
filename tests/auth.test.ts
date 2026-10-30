import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { pool } from '../src/db/pool.js';
import { seed } from '../src/db/seed.js';

describe('Authentication & Role-Based Access Control', () => {
  beforeAll(async () => {
    await seed();
  });

  afterAll(async () => {
    await pool.end();
  });

  it('renders login page with proper accessibility landmarks and form fields', async () => {
    const res = await request(app).get('/auth/login');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Sign In');
    expect(res.text).toContain('id="email"');
    expect(res.text).toContain('id="password"');
    expect(res.text).toContain('Skip to main content');
  });

  it('fails with 422 when submitting invalid email format', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'not-an-email', password: 'Password123!' });

    expect(res.status).toBe(422);
    expect(res.text).toContain('Please enter a valid email address');
    expect(res.text).toContain('role="alert"');
  });

  it('fails with 422 when password is empty', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'coordinator@workshophouse.test', password: '' });

    expect(res.status).toBe(422);
    expect(res.text).toContain('Password is required');
  });

  it('fails with 422 on incorrect password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'coordinator@workshophouse.test', password: 'WrongPassword999!' });

    expect(res.status).toBe(422);
    expect(res.text).toContain('Invalid email or password');
  });

  it('fails with 422 on non-existent email', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'nonexistent@workshophouse.test', password: 'Password123!' });

    expect(res.status).toBe(422);
    expect(res.text).toContain('Invalid email or password');
  });

  it('logs in successfully and sets session cookie', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'coordinator@workshophouse.test', password: 'Password123!' });

    expect(res.status).toBe(302);
    expect(res.header.location).toBe('/');
    expect(res.header['set-cookie']).toBeDefined();
    const cookie = res.header['set-cookie']![0];
    expect(cookie).toContain('connect.sid');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
  });

  it('redirects unauthenticated users trying to access role-protected pages', async () => {
    const res = await request(app).get('/coordinator/sessions');
    expect(res.status).toBe(302);
    expect(res.header.location).toBe('/auth/login');
  });

  it('denies learner from accessing coordinator area with 403 Forbidden', async () => {
    const agent = request.agent(app);

    // Login as learner
    const loginRes = await agent
      .post('/auth/login')
      .send({ email: 'charlie.learner@workshophouse.test', password: 'Password123!' });
    expect(loginRes.status).toBe(302);

    // Try accessing coordinator route
    const coordRes = await agent.get('/coordinator/sessions');
    expect(coordRes.status).toBe(403);
    expect(coordRes.text).toContain('Access Forbidden');
    expect(coordRes.text).toContain('does not have permission');
  });

  it('allows coordinator to access coordinator area', async () => {
    const agent = request.agent(app);

    // Login as coordinator
    const loginRes = await agent
      .post('/auth/login')
      .send({ email: 'coordinator@workshophouse.test', password: 'Password123!' });
    expect(loginRes.status).toBe(302);

    const coordRes = await agent.get('/coordinator/sessions');
    expect(coordRes.status).toBe(200);
    expect(coordRes.text).toContain('Coordinator Area');
  });

  it('allows trainer to access trainer area and denies learner', async () => {
    const trainerAgent = request.agent(app);
    await trainerAgent
      .post('/auth/login')
      .send({ email: 'alice.trainer@workshophouse.test', password: 'Password123!' });

    const trainerRes = await trainerAgent.get('/trainer/sessions');
    expect(trainerRes.status).toBe(200);
    expect(trainerRes.text).toContain('Trainer Area');

    const learnerAgent = request.agent(app);
    await learnerAgent
      .post('/auth/login')
      .send({ email: 'charlie.learner@workshophouse.test', password: 'Password123!' });

    const forbiddenRes = await learnerAgent.get('/trainer/sessions');
    expect(forbiddenRes.status).toBe(403);
  });

  it('logs out and clears session cookie', async () => {
    const agent = request.agent(app);

    // Login
    await agent
      .post('/auth/login')
      .send({ email: 'coordinator@workshophouse.test', password: 'Password123!' });

    // Verify logged in
    const checkRes = await agent.get('/coordinator/sessions');
    expect(checkRes.status).toBe(200);

    // Logout
    const logoutRes = await agent.post('/auth/logout');
    expect(logoutRes.status).toBe(302);
    expect(logoutRes.header.location).toBe('/auth/login');

    // Access coordinator route again -> should redirect to login
    const afterLogoutRes = await agent.get('/coordinator/sessions');
    expect(afterLogoutRes.status).toBe(302);
    expect(afterLogoutRes.header.location).toBe('/auth/login');
  });
});
