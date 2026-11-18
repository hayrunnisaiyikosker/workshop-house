import { Router, type Request, type Response } from 'express';
import { listSessions, getSessionById } from '../services/sessions.js';
import { enrollLearner, cancelEnrollment } from '../services/enrollment.js';
import { listAnnouncements } from '../services/announcements.js';
import { requireRole } from '../middleware/requireRole.js';

export const sessionsRouter = Router();

// Public / Learner session list
sessionsRouter.get('/', async (req: Request, res: Response) => {
  const currentUserId = req.currentUser?.id;
  const sessions = await listSessions(currentUserId);

  res.render('pages/sessions/index.njk', {
    pageTitle: 'Available Workshops & Sessions - Workshop House',
    sessions,
  });
});

// Session detail page
sessionsRouter.get('/:id', async (req: Request, res: Response) => {
  const sessionId = req.params['id'] as string;
  const currentUserId = req.currentUser?.id;
  const currentUserRole = req.currentUser?.role;

  const [session, announcements] = await Promise.all([
    getSessionById(sessionId, currentUserId, currentUserRole),
    listAnnouncements(sessionId),
  ]);

  if (!session) {
    res.status(404);
    return res.render('pages/error.njk', {
      pageTitle: '404 Session Not Found',
      statusCode: 404,
      title: 'Session Not Found',
      message: 'The requested workshop session does not exist.',
    });
  }

  res.render('pages/sessions/detail.njk', {
    pageTitle: `${session.course_title} - Workshop House`,
    session,
    announcements,
  });
});

// Enroll action (Learners only)
sessionsRouter.post('/:id/enroll', requireRole('learner'), async (req: Request, res: Response) => {
  const sessionId = req.params['id'] as string;
  const learnerId = req.currentUser!.id;

  const result = await enrollLearner(sessionId, learnerId);

  if (!result.success) {
    req.session.flashError = result.message;
    return res.redirect(`/sessions/${sessionId}`);
  }

  req.session.flashSuccess = result.reactivated
    ? 'Welcome back! Your previous enrollment has been reactivated.'
    : 'You have successfully enrolled in this workshop session!';

  res.redirect('/my-sessions');
});

// Cancel enrollment action (Learners only)
sessionsRouter.post('/:id/cancel', requireRole('learner'), async (req: Request, res: Response) => {
  const sessionId = req.params['id'] as string;
  const learnerId = req.currentUser!.id;

  const result = await cancelEnrollment(sessionId, learnerId);

  if (!result.success) {
    req.session.flashError = result.message;
  } else {
    req.session.flashSuccess = 'Your enrollment has been cancelled.';
  }

  res.redirect('/my-sessions');
});
