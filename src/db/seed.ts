import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import argon2 from 'argon2';
import { pool } from './pool.js';
import { runMigrations } from './migrate.js';

export async function seed(): Promise<void> {
  console.log('Running migrations prior to seeding...');
  await runMigrations();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('Seeding database with demo data...');

    // Clean existing data
    await client.query(`
      TRUNCATE TABLE 
        attendance, 
        completions, 
        announcements, 
        enrollments, 
        sessions, 
        courses, 
        user_preferences, 
        users 
      RESTART IDENTITY CASCADE;
    `);

    // Standard hash for all demo accounts
    const defaultPassword = 'Password123!';
    const passwordHash = await argon2.hash(defaultPassword);

    // 1. Users (1 coordinator, 2 trainers, 5 learners)
    const usersData = [
      {
        name: 'Clara Coordinator',
        email: 'coordinator@workshophouse.test',
        role: 'coordinator',
      },
      {
        name: 'Alice Trainer',
        email: 'alice.trainer@workshophouse.test',
        role: 'trainer',
      },
      {
        name: 'Bob Trainer',
        email: 'bob.trainer@workshophouse.test',
        role: 'trainer',
      },
      {
        name: 'Charlie Learner',
        email: 'charlie.learner@workshophouse.test',
        role: 'learner',
      },
      {
        name: 'Diana Learner',
        email: 'diana.learner@workshophouse.test',
        role: 'learner',
      },
      {
        name: 'Evan Learner',
        email: 'evan.learner@workshophouse.test',
        role: 'learner',
      },
      {
        name: 'Fiona Learner',
        email: 'fiona.learner@workshophouse.test',
        role: 'learner',
      },
      {
        name: 'George Learner',
        email: 'george.learner@workshophouse.test',
        role: 'learner',
      },
    ];

    const usersMap = new Map<string, string>(); // email -> id

    for (const u of usersData) {
      const res = await client.query<{ id: string }>(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [u.name, u.email, passwordHash, u.role]
      );
      const userId = res.rows[0]!.id;
      usersMap.set(u.email, userId);

      // Create default user preferences
      await client.query(
        `INSERT INTO user_preferences (user_id, text_scale, high_contrast, reduced_motion, shortcuts_enabled)
         VALUES ($1, '100', false, false, true)`,
        [userId]
      );
    }

    // 2. Courses (2 courses)
    const coursesData = [
      {
        title: 'Full-Stack TypeScript & Node.js',
        description: 'Comprehensive hands-on workshop covering Node.js 20+, Express 5, TypeScript strict mode, and testing with Vitest.',
      },
      {
        title: 'PostgreSQL Architecture & Concurrency',
        description: 'Deep dive into relational modeling, explicit row locking with FOR UPDATE, ACID transactions, and performance tuning.',
      },
    ];

    const courseIds: string[] = [];
    for (const c of coursesData) {
      const res = await client.query<{ id: string }>(
        `INSERT INTO courses (title, description)
         VALUES ($1, $2)
         RETURNING id`,
        [c.title, c.description]
      );
      courseIds.push(res.rows[0]!.id);
    }

    const course1Id = courseIds[0]!;
    const course2Id = courseIds[1]!;
    const trainerAliceId = usersMap.get('alice.trainer@workshophouse.test')!;
    const trainerBobId = usersMap.get('bob.trainer@workshophouse.test')!;
    const learnerCharlieId = usersMap.get('charlie.learner@workshophouse.test')!;
    const learnerDianaId = usersMap.get('diana.learner@workshophouse.test')!;
    const learnerEvanId = usersMap.get('evan.learner@workshophouse.test')!;
    const learnerFionaId = usersMap.get('fiona.learner@workshophouse.test')!;
    const learnerGeorgeId = usersMap.get('george.learner@workshophouse.test')!;

    // 3. Sessions (past, near-full, full, upcoming)
    const now = new Date();

    // Past session: ended yesterday
    const pastStart = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const pastEnd = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000);

    // Full session: capacity 2, 2 active enrollments
    const fullStart = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
    const fullEnd = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000);

    // Near-full session: capacity 4, 3 active enrollments
    const nearFullStart = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const nearFullEnd = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000);

    // Upcoming session: capacity 20, 1 active enrollment
    const upcomingStart = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000);

    const pastSessionRes = await client.query<{ id: string }>(
      `INSERT INTO sessions (course_id, trainer_id, starts_at, ends_at, room, capacity, resource_url)
       VALUES ($1, $2, $3, $4, 'Lab 101', 10, 'https://resources.workshophouse.test/past-lab')
       RETURNING id`,
      [course1Id, trainerAliceId, pastStart, pastEnd]
    );
    const pastSessionId = pastSessionRes.rows[0]!.id;

    const fullSessionRes = await client.query<{ id: string }>(
      `INSERT INTO sessions (course_id, trainer_id, starts_at, ends_at, room, capacity, resource_url)
       VALUES ($1, $2, $3, $4, 'Seminar Room B', 2, 'https://resources.workshophouse.test/full-session')
       RETURNING id`,
      [course2Id, trainerBobId, fullStart, fullEnd]
    );
    const fullSessionId = fullSessionRes.rows[0]!.id;

    const nearFullSessionRes = await client.query<{ id: string }>(
      `INSERT INTO sessions (course_id, trainer_id, starts_at, ends_at, room, capacity, resource_url)
       VALUES ($1, $2, $3, $4, 'Lab 202', 4, 'https://resources.workshophouse.test/near-full')
       RETURNING id`,
      [course1Id, trainerAliceId, nearFullStart, nearFullEnd]
    );
    const nearFullSessionId = nearFullSessionRes.rows[0]!.id;

    const upcomingSessionRes = await client.query<{ id: string }>(
      `INSERT INTO sessions (course_id, trainer_id, starts_at, ends_at, room, capacity, resource_url)
       VALUES ($1, $2, $3, $4, 'Hall A', 20, 'https://resources.workshophouse.test/upcoming')
       RETURNING id`,
      [course2Id, trainerBobId, upcomingStart, upcomingEnd]
    );
    const upcomingSessionId = upcomingSessionRes.rows[0]!.id;

    // Helper for random checkin code
    const makeCode = () => crypto.randomBytes(3).toString('hex').toUpperCase();

    // 4. Enrollments
    // Past session: Charlie (active, attended), Diana (active, completed)
    const enPastCharlie = await client.query<{ id: string }>(
      `INSERT INTO enrollments (session_id, learner_id, status, checkin_code)
       VALUES ($1, $2, 'active', $3) RETURNING id`,
      [pastSessionId, learnerCharlieId, makeCode()]
    );
    await client.query(
      `INSERT INTO attendance (enrollment_id, status, method, marked_by)
       VALUES ($1, 'attended', 'manual', $2)`,
      [enPastCharlie.rows[0]!.id, trainerAliceId]
    );

    const enPastDiana = await client.query<{ id: string }>(
      `INSERT INTO enrollments (session_id, learner_id, status, checkin_code)
       VALUES ($1, $2, 'active', $3) RETURNING id`,
      [pastSessionId, learnerDianaId, makeCode()]
    );
    await client.query(
      `INSERT INTO attendance (enrollment_id, status, method, marked_by)
       VALUES ($1, 'attended', 'code', $2)`,
      [enPastDiana.rows[0]!.id, trainerAliceId]
    );
    await client.query(
      `INSERT INTO completions (enrollment_id, recorded_by)
       VALUES ($1, $2)`,
      [enPastDiana.rows[0]!.id, trainerAliceId]
    );

    // Full session: capacity 2, Charlie and Diana (2 active) -> 0 seats free
    await client.query(
      `INSERT INTO enrollments (session_id, learner_id, status, checkin_code)
       VALUES ($1, $2, 'active', $3)`,
      [fullSessionId, learnerCharlieId, makeCode()]
    );
    await client.query(
      `INSERT INTO enrollments (session_id, learner_id, status, checkin_code)
       VALUES ($1, $2, 'active', $3)`,
      [fullSessionId, learnerDianaId, makeCode()]
    );

    // Near-full session: capacity 4, Evan, Fiona, George (3 active), Diana (cancelled) -> 1 seat free
    await client.query(
      `INSERT INTO enrollments (session_id, learner_id, status, checkin_code)
       VALUES ($1, $2, 'active', $3)`,
      [nearFullSessionId, learnerEvanId, makeCode()]
    );
    await client.query(
      `INSERT INTO enrollments (session_id, learner_id, status, checkin_code)
       VALUES ($1, $2, 'active', $3)`,
      [nearFullSessionId, learnerFionaId, makeCode()]
    );
    await client.query(
      `INSERT INTO enrollments (session_id, learner_id, status, checkin_code)
       VALUES ($1, $2, 'active', $3)`,
      [nearFullSessionId, learnerGeorgeId, makeCode()]
    );
    await client.query(
      `INSERT INTO enrollments (session_id, learner_id, status, cancelled_at, checkin_code)
       VALUES ($1, $2, 'cancelled', NOW(), $3)`,
      [nearFullSessionId, learnerDianaId, makeCode()]
    );

    // Upcoming session: Charlie enrolled
    await client.query(
      `INSERT INTO enrollments (session_id, learner_id, status, checkin_code)
       VALUES ($1, $2, 'active', $3)`,
      [upcomingSessionId, learnerCharlieId, makeCode()]
    );

    // Announcements
    await client.query(
      `INSERT INTO announcements (session_id, author_id, body)
       VALUES ($1, $2, 'Welcome everyone! Please prepare your laptop with Node.js 20+ installed.')`,
      [nearFullSessionId, trainerAliceId]
    );

    await client.query('COMMIT');
    console.log('Seeding completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

// If executed directly from CLI
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  seed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
