import { Router, type Request, type Response } from 'express';
import { requireRole } from '../middleware/requireRole.js';
import { courseSchema } from '../validation/courses.js';
import { sessionSchema } from '../validation/sessions.js';
import { formatZodErrors } from '../a11y/errors.js';
import {
  listCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} from '../services/courses.js';
import {
  listSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
  listTrainers,
} from '../services/sessions.js';

export const coordinatorRouter = Router();

coordinatorRouter.use(requireRole('coordinator'));

// ================= Courses CRUD =================

coordinatorRouter.get('/courses', async (_req: Request, res: Response) => {
  const courses = await listCourses();
  res.render('pages/coordinator/courses.njk', {
    pageTitle: 'Manage Courses - Coordinator',
    courses,
  });
});

coordinatorRouter.get('/courses/new', (_req: Request, res: Response) => {
  res.render('pages/coordinator/course-form.njk', {
    pageTitle: 'Create New Course - Coordinator',
    values: {},
    isEdit: false,
  });
});

coordinatorRouter.post('/courses/new', async (req: Request, res: Response) => {
  const parseResult = courseSchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(422);
    return res.render('pages/coordinator/course-form.njk', {
      pageTitle: 'Create New Course - Coordinator',
      values: req.body,
      isEdit: false,
      errors: formatZodErrors(parseResult.error),
    });
  }

  await createCourse(parseResult.data);
  req.session.flashSuccess = 'Course successfully created!';
  res.redirect('/coordinator/courses');
});

coordinatorRouter.get('/courses/:id/edit', async (req: Request, res: Response) => {
  const course = await getCourseById(req.params['id'] as string);
  if (!course) {
    req.session.flashError = 'Course not found.';
    return res.redirect('/coordinator/courses');
  }

  res.render('pages/coordinator/course-form.njk', {
    pageTitle: `Edit Course: ${course.title} - Coordinator`,
    values: course,
    isEdit: true,
    courseId: course.id,
  });
});

coordinatorRouter.post('/courses/:id/edit', async (req: Request, res: Response) => {
  const courseId = req.params['id'] as string;
  const parseResult = courseSchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(422);
    return res.render('pages/coordinator/course-form.njk', {
      pageTitle: 'Edit Course - Coordinator',
      values: { ...req.body, id: courseId },
      isEdit: true,
      courseId,
      errors: formatZodErrors(parseResult.error),
    });
  }

  const updated = await updateCourse(courseId, parseResult.data);
  if (!updated) {
    req.session.flashError = 'Course not found.';
    return res.redirect('/coordinator/courses');
  }

  req.session.flashSuccess = 'Course successfully updated!';
  res.redirect('/coordinator/courses');
});

coordinatorRouter.post('/courses/:id/delete', async (req: Request, res: Response) => {
  const courseId = req.params['id'] as string;
  await deleteCourse(courseId);
  req.session.flashSuccess = 'Course deleted.';
  res.redirect('/coordinator/courses');
});

// ================= Sessions CRUD =================

coordinatorRouter.get('/sessions', async (_req: Request, res: Response) => {
  const sessions = await listSessions();
  res.render('pages/coordinator/sessions.njk', {
    pageTitle: 'Manage Sessions - Coordinator',
    sessions,
  });
});

coordinatorRouter.get('/sessions/new', async (_req: Request, res: Response) => {
  const [courses, trainers] = await Promise.all([listCourses(), listTrainers()]);
  res.render('pages/coordinator/session-form.njk', {
    pageTitle: 'Create New Session - Coordinator',
    courses,
    trainers,
    values: {},
    isEdit: false,
  });
});

coordinatorRouter.post('/sessions/new', async (req: Request, res: Response) => {
  const parseResult = sessionSchema.safeParse(req.body);

  if (!parseResult.success) {
    const [courses, trainers] = await Promise.all([listCourses(), listTrainers()]);
    res.status(422);
    return res.render('pages/coordinator/session-form.njk', {
      pageTitle: 'Create New Session - Coordinator',
      courses,
      trainers,
      values: req.body,
      isEdit: false,
      errors: formatZodErrors(parseResult.error),
    });
  }

  await createSession(parseResult.data);
  req.session.flashSuccess = 'Session successfully created!';
  res.redirect('/coordinator/sessions');
});

coordinatorRouter.get('/sessions/:id/edit', async (req: Request, res: Response) => {
  const sessionId = req.params['id'] as string;
  const [session, courses, trainers] = await Promise.all([
    getSessionById(sessionId),
    listCourses(),
    listTrainers(),
  ]);

  if (!session) {
    req.session.flashError = 'Session not found.';
    return res.redirect('/coordinator/sessions');
  }

  // Format dates for datetime-local input (YYYY-MM-DDTHH:mm)
  const formatForInput = (d: Date) => d.toISOString().slice(0, 16);

  res.render('pages/coordinator/session-form.njk', {
    pageTitle: `Edit Session - Coordinator`,
    courses,
    trainers,
    values: {
      ...session,
      starts_at: formatForInput(session.starts_at),
      ends_at: formatForInput(session.ends_at),
    },
    isEdit: true,
    sessionId: session.id,
    activeEnrollments: session.active_enrollments,
  });
});

coordinatorRouter.post('/sessions/:id/edit', async (req: Request, res: Response) => {
  const sessionId = req.params['id'] as string;
  const parseResult = sessionSchema.safeParse(req.body);

  if (!parseResult.success) {
    const [courses, trainers] = await Promise.all([listCourses(), listTrainers()]);
    res.status(422);
    return res.render('pages/coordinator/session-form.njk', {
      pageTitle: 'Edit Session - Coordinator',
      courses,
      trainers,
      values: { ...req.body, id: sessionId },
      isEdit: true,
      sessionId,
      errors: formatZodErrors(parseResult.error),
    });
  }

  const updateResult = await updateSession(sessionId, parseResult.data);
  if (!updateResult.success) {
    const [courses, trainers] = await Promise.all([listCourses(), listTrainers()]);
    res.status(422);
    return res.render('pages/coordinator/session-form.njk', {
      pageTitle: 'Edit Session - Coordinator',
      courses,
      trainers,
      values: { ...req.body, id: sessionId },
      isEdit: true,
      sessionId,
      errors: {
        summary: [{ field: 'capacity', id: 'capacity-error', message: updateResult.error }],
        byField: {
          capacity: { field: 'capacity', id: 'capacity-error', message: updateResult.error },
        },
      },
    });
  }

  req.session.flashSuccess = 'Session successfully updated!';
  res.redirect('/coordinator/sessions');
});

coordinatorRouter.post('/sessions/:id/delete', async (req: Request, res: Response) => {
  const sessionId = req.params['id'] as string;
  await deleteSession(sessionId);
  req.session.flashSuccess = 'Session deleted.';
  res.redirect('/coordinator/sessions');
});
