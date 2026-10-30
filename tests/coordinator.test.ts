import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { pool, query } from '../src/db/pool.js';
import { seed } from '../src/db/seed.js';

describe('Coordinator Courses & Sessions Management', () => {
  let coordinatorAgent: ReturnType<typeof request.agent>;
  let learnerAgent: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    await seed();

    coordinatorAgent = request.agent(app);
    await coordinatorAgent
      .post('/auth/login')
      .send({ email: 'coordinator@workshophouse.test', password: 'Password123!' });

    learnerAgent = request.agent(app);
    await learnerAgent
      .post('/auth/login')
      .send({ email: 'charlie.learner@workshophouse.test', password: 'Password123!' });
  });

  afterAll(async () => {
    await pool.end();
  });

  it('allows coordinator to list courses', async () => {
    const res = await coordinatorAgent.get('/coordinator/courses');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Manage Courses');
    expect(res.text).toContain('TypeScript');
  });

  it('allows coordinator to create a course', async () => {
    const res = await coordinatorAgent
      .post('/coordinator/courses/new')
      .send({
        title: 'Cloud Native Microservices',
        description: 'Building resilient cloud microservices with Docker, Kubernetes, and Node.js.',
      });

    expect(res.status).toBe(302);
    expect(res.header.location).toBe('/coordinator/courses');

    const check = await query('SELECT id FROM courses WHERE title = $1', [
      'Cloud Native Microservices',
    ]);
    expect(check.rows.length).toBe(1);
  });

  it('validates course creation with Zod and returns accessible error summary on invalid input', async () => {
    const res = await coordinatorAgent
      .post('/coordinator/courses/new')
      .send({
        title: 'Hi', // too short (< 3)
        description: 'Short', // too short (< 10)
      });

    expect(res.status).toBe(422);
    expect(res.text).toContain('Course title must be at least 3 characters long');
    expect(res.text).toContain('Course description must be at least 10 characters long');
    expect(res.text).toContain('id="error-summary-title"');
  });

  it('allows coordinator to create a session', async () => {
    const courseRes = await query<{ id: string }>('SELECT id FROM courses LIMIT 1');
    const trainerRes = await query<{ id: string }>("SELECT id FROM users WHERE role = 'trainer' LIMIT 1");
    const courseId = courseRes.rows[0]!.id;
    const trainerId = trainerRes.rows[0]!.id;

    const startsAt = new Date(Date.now() + 86400000).toISOString().slice(0, 16);
    const endsAt = new Date(Date.now() + 90000000).toISOString().slice(0, 16);

    const res = await coordinatorAgent
      .post('/coordinator/sessions/new')
      .send({
        course_id: courseId,
        trainer_id: trainerId,
        starts_at: startsAt,
        ends_at: endsAt,
        room: 'Lab 305',
        capacity: 12,
        resource_url: 'https://workshophouse.test/resources/lab305',
      });

    expect(res.status).toBe(302);
    expect(res.header.location).toBe('/coordinator/sessions');

    const check = await query('SELECT id FROM sessions WHERE room = $1', ['Lab 305']);
    expect(check.rows.length).toBe(1);
  });

  it('refuses to lower capacity below active enrollments', async () => {
    // Find near-full session which has 3 active enrollments and capacity 4
    const sessionRes = await query<{ id: string; room: string; course_id: string; trainer_id: string; starts_at: Date; ends_at: Date }>(`
      SELECT s.id, s.room, s.course_id, s.trainer_id, s.starts_at, s.ends_at
      FROM sessions s
      JOIN enrollments e ON e.session_id = s.id AND e.status = 'active'
      GROUP BY s.id
      HAVING COUNT(e.id) >= 2
      LIMIT 1
    `);

    const session = sessionRes.rows[0]!;

    // Attempt to lower capacity to 1 (when active enrollments >= 2)
    const res = await coordinatorAgent
      .post(`/coordinator/sessions/${session.id}/edit`)
      .send({
        course_id: session.course_id,
        trainer_id: session.trainer_id,
        starts_at: session.starts_at.toISOString().slice(0, 16),
        ends_at: session.ends_at.toISOString().slice(0, 16),
        room: session.room,
        capacity: 1, // Illegal: active enrollments >= 2
      });

    expect(res.status).toBe(422);
    expect(res.text).toContain('Capacity cannot be lowered');
  });

  it('denies learner from accessing coordinator routes with 403 Forbidden', async () => {
    const res = await learnerAgent.get('/coordinator/courses');
    expect(res.status).toBe(403);
  });
});
