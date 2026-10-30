import { query } from '../db/pool.js';
import type { CourseInput } from '../validation/courses.js';

export interface Course {
  id: string;
  title: string;
  description: string;
  created_at: Date;
  session_count?: number;
}

export async function listCourses(): Promise<Course[]> {
  const result = await query<Course & { session_count: string }>(`
    SELECT 
      c.id, 
      c.title, 
      c.description, 
      c.created_at,
      COUNT(s.id) as session_count
    FROM courses c
    LEFT JOIN sessions s ON s.course_id = c.id
    GROUP BY c.id
    ORDER BY c.title ASC
  `);

  return result.rows.map((r) => ({
    ...r,
    session_count: parseInt(r.session_count, 10),
  }));
}

export async function getCourseById(id: string): Promise<Course | null> {
  const result = await query<Course>(
    'SELECT id, title, description, created_at FROM courses WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

export async function createCourse(data: CourseInput): Promise<Course> {
  const result = await query<Course>(
    `INSERT INTO courses (title, description)
     VALUES ($1, $2)
     RETURNING id, title, description, created_at`,
    [data.title, data.description]
  );
  return result.rows[0]!;
}

export async function updateCourse(id: string, data: CourseInput): Promise<Course | null> {
  const result = await query<Course>(
    `UPDATE courses
     SET title = $1, description = $2
     WHERE id = $3
     RETURNING id, title, description, created_at`,
    [data.title, data.description, id]
  );
  return result.rows[0] || null;
}

export async function deleteCourse(id: string): Promise<boolean> {
  const result = await query('DELETE FROM courses WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}
