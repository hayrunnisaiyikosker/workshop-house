import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { pool, query } from '../src/db/pool.js';
import { seed } from '../src/db/seed.js';

describe('Phase 3: User Preferences & Accessibility Settings', () => {
  let learnerAgent: ReturnType<typeof request.agent>;
  let learnerId: string;

  beforeAll(async () => {
    await seed();

    const uRes = await query<{ id: string }>(
      "SELECT id FROM users WHERE email = 'charlie.learner@workshophouse.test'"
    );
    learnerId = uRes.rows[0]!.id;

    learnerAgent = request.agent(app);
    await learnerAgent
      .post('/auth/login')
      .send({ email: 'charlie.learner@workshophouse.test', password: 'Password123!' });
  });

  afterAll(async () => {
    await pool.end();
  });

  it('Renders preferences page with current options', async () => {
    const res = await learnerAgent.get('/preferences');
    expect(res.status).toBe(200);
    expect(res.text).toContain('User Accessibility & Display Preferences');
    expect(res.text).toContain('name="text_scale"');
    expect(res.text).toContain('name="high_contrast"');
    expect(res.text).toContain('name="shortcuts_enabled"');
  });

  it('Saves updated accessibility preferences and reflects them in layout data attributes', async () => {
    const postRes = await learnerAgent.post('/preferences').send({
      text_scale: '150',
      high_contrast: 'true',
      reduced_motion: 'true',
      shortcuts_enabled: 'false',
    });

    expect(postRes.status).toBe(302);
    expect(postRes.header.location).toBe('/preferences');

    // Verify database record
    const dbCheck = await query<{
      text_scale: string;
      high_contrast: boolean;
      reduced_motion: boolean;
      shortcuts_enabled: boolean;
    }>('SELECT * FROM user_preferences WHERE user_id = $1', [learnerId]);

    expect(dbCheck.rows[0]!.text_scale).toBe('150');
    expect(dbCheck.rows[0]!.high_contrast).toBe(true);
    expect(dbCheck.rows[0]!.reduced_motion).toBe(true);
    expect(dbCheck.rows[0]!.shortcuts_enabled).toBe(false);

    // Verify rendered HTML attributes
    const pageRes = await learnerAgent.get('/preferences');
    expect(pageRes.status).toBe(200);
    expect(pageRes.text).toContain('data-text-scale="150"');
    expect(pageRes.text).toContain('data-high-contrast="true"');
    expect(pageRes.text).toContain('data-reduced-motion="true"');
    expect(pageRes.text).toContain('data-shortcuts-enabled="false"');
  });
});
