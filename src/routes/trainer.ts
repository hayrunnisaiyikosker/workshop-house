import { Router, type Request, type Response } from 'express';
import { requireRole } from '../middleware/requireRole.js';
import { trainerResourceSchema } from '../validation/sessions.js';
import { manualAttendanceSchema, checkinCodeSchema } from '../validation/attendance.js';
import { announcementSchema } from '../validation/announcements.js';
import { listTrainerSessions, updateTrainerResource, getSessionById } from '../services/sessions.js';
import {
  getSessionAttendance,
  markAttendanceManual,
  markCheckinCode,
} from '../services/attendance.js';
import { toggleCompletion } from '../services/completion.js';
import { createAnnouncement, listAnnouncements } from '../services/announcements.js';

export const trainerRouter = Router();

trainerRouter.use(requireRole(['trainer', 'coordinator']));

// Trainer dashboard listing assigned sessions
trainerRouter.get('/sessions', async (req: Request, res: Response) => {
  const trainerId = req.currentUser!.id;
  const sessions = await listTrainerSessions(trainerId);

  res.render('pages/trainer/sessions.njk', {
    pageTitle: 'My Assigned Sessions - Trainer Dashboard',
    sessions,
  });
});

// Update session resource URL
trainerRouter.post('/sessions/:id/resource', async (req: Request, res: Response) => {
  const sessionId = req.params['id'] as string;
  const trainerId = req.currentUser!.id;

  const parseResult = trainerResourceSchema.safeParse(req.body);
  if (!parseResult.success) {
    req.session.flashError = 'Please provide a valid web address (URL) for the resource link.';
    return res.redirect('/trainer/sessions');
  }

  const result = await updateTrainerResource(
    sessionId,
    trainerId,
    parseResult.data.resource_url || null
  );

  if (result.status === 'FORBIDDEN') {
    res.status(403);
    return res.render('pages/error.njk', {
      pageTitle: '403 Forbidden - Workshop House',
      statusCode: 403,
      title: 'Access Forbidden',
      message: 'You are not assigned as the trainer for this session and cannot modify its resources.',
    });
  }

  if (result.status === 'NOT_FOUND') {
    req.session.flashError = 'Session not found.';
    return res.redirect('/trainer/sessions');
  }

  req.session.flashSuccess = 'Session resource URL updated successfully!';
  res.redirect('/trainer/sessions');
});

// Attendance overview page for a session
trainerRouter.get('/sessions/:id/attendance', async (req: Request, res: Response) => {
  const sessionId = req.params['id'] as string;
  const userId = req.currentUser!.id;
  const userRole = req.currentUser!.role;

  const result = await getSessionAttendance(sessionId, userId, userRole);
  if (result.error === 'FORBIDDEN') {
    res.status(403);
    return res.render('pages/error.njk', {
      pageTitle: '403 Forbidden - Workshop House',
      statusCode: 403,
      title: 'Access Forbidden',
      message: 'You can only view attendance for your own sessions.',
    });
  }

  if (result.error === 'NOT_FOUND' || !result.data) {
    res.status(404);
    return res.render('pages/error.njk', {
      pageTitle: '404 Session Not Found',
      statusCode: 404,
      title: 'Session Not Found',
      message: 'The requested workshop session does not exist.',
    });
  }

  const announcements = await listAnnouncements(sessionId);

  res.render('pages/trainer/attendance.njk', {
    pageTitle: `Attendance: ${result.data.courseTitle} - Trainer`,
    attendanceData: result.data,
    announcements,
  });
});

// Manual attendance marking (attended / absent)
trainerRouter.post('/sessions/:id/attendance/:enrollmentId', async (req: Request, res: Response) => {
  const sessionId = req.params['id'] as string;
  const enrollmentId = req.params['enrollmentId'] as string;
  const userId = req.currentUser!.id;
  const userRole = req.currentUser!.role;

  const parseResult = manualAttendanceSchema.safeParse(req.body);
  if (!parseResult.success) {
    req.session.flashError = 'Invalid status value. Must be attended or absent.';
    return res.redirect(`/trainer/sessions/${sessionId}/attendance`);
  }

  const result = await markAttendanceManual(
    sessionId,
    enrollmentId,
    parseResult.data.status,
    userId,
    userRole
  );

  if (!result.success) {
    if (result.reason === 'FORBIDDEN') {
      res.status(403);
      return res.render('pages/error.njk', {
        pageTitle: '403 Forbidden',
        statusCode: 403,
        title: 'Access Forbidden',
        message: result.message,
      });
    }
    req.session.flashError = result.message;
    return res.redirect(`/trainer/sessions/${sessionId}/attendance`);
  }

  req.session.flashSuccess = `Attendance status updated to ${parseResult.data.status}.`;
  res.redirect(`/trainer/sessions/${sessionId}/attendance`);
});

// Toggle completion for an enrollment
trainerRouter.post('/sessions/:id/completions/:enrollmentId', async (req: Request, res: Response) => {
  const sessionId = req.params['id'] as string;
  const enrollmentId = req.params['enrollmentId'] as string;
  const userId = req.currentUser!.id;
  const userRole = req.currentUser!.role;

  const result = await toggleCompletion(sessionId, enrollmentId, userId, userRole);
  if (!result.success) {
    if (result.reason === 'FORBIDDEN') {
      res.status(403);
      return res.render('pages/error.njk', {
        pageTitle: '403 Forbidden',
        statusCode: 403,
        title: 'Access Forbidden',
        message: result.message,
      });
    }
    req.session.flashError = result.message;
    return res.redirect(`/trainer/sessions/${sessionId}/attendance`);
  }

  req.session.flashSuccess = result.completed
    ? 'Participant marked as successfully completed!'
    : 'Completion record removed.';
  res.redirect(`/trainer/sessions/${sessionId}/attendance`);
});

// Check-in interface page (form to enter checkin code or scan)
trainerRouter.get('/sessions/:id/checkin', async (req: Request, res: Response) => {
  const sessionId = req.params['id'] as string;
  const session = await getSessionById(sessionId);

  if (!session) {
    res.status(404);
    return res.render('pages/error.njk', {
      pageTitle: '404 Session Not Found',
      statusCode: 404,
      title: 'Session Not Found',
      message: 'The requested workshop session does not exist.',
    });
  }

  if (req.currentUser!.role === 'trainer' && session.trainer_id !== req.currentUser!.id) {
    res.status(403);
    return res.render('pages/error.njk', {
      pageTitle: '403 Forbidden',
      statusCode: 403,
      title: 'Access Forbidden',
      message: 'You can only conduct check-in for your own sessions.',
    });
  }

  res.render('pages/trainer/checkin.njk', {
    pageTitle: `Check-in: ${session.course_title} - Workshop House`,
    session,
  });
});

// Process check-in code
trainerRouter.post('/sessions/:id/checkin', async (req: Request, res: Response) => {
  const sessionId = req.params['id'] as string;
  const userId = req.currentUser!.id;
  const userRole = req.currentUser!.role;

  const parseResult = checkinCodeSchema.safeParse(req.body);
  if (!parseResult.success) {
    req.session.flashError = 'Please enter a valid check-in code.';
    return res.redirect(`/trainer/sessions/${sessionId}/checkin`);
  }

  const result = await markCheckinCode(sessionId, parseResult.data.code, userId, userRole, true);

  if (!result.success) {
    if (result.reason === 'FORBIDDEN') {
      res.status(403);
      return res.render('pages/error.njk', {
        pageTitle: '403 Forbidden',
        statusCode: 403,
        title: 'Access Forbidden',
        message: result.message,
      });
    }
    req.session.flashError = result.message;
  } else {
    req.session.flashSuccess = `Check-in recorded successfully for ${result.learnerName}!`;
  }

  res.redirect(`/trainer/sessions/${sessionId}/checkin`);
});

// Post announcement to session
trainerRouter.post('/sessions/:id/announcements', async (req: Request, res: Response) => {
  const sessionId = req.params['id'] as string;
  const userId = req.currentUser!.id;
  const userRole = req.currentUser!.role;

  const parseResult = announcementSchema.safeParse(req.body);
  if (!parseResult.success) {
    req.session.flashError = 'Announcement text must be at least 3 characters long.';
    return res.redirect(`/trainer/sessions/${sessionId}/attendance`);
  }

  const result = await createAnnouncement(sessionId, userId, parseResult.data.body, userRole);
  if (!result.success) {
    if (result.reason === 'FORBIDDEN') {
      res.status(403);
      return res.render('pages/error.njk', {
        pageTitle: '403 Forbidden',
        statusCode: 403,
        title: 'Access Forbidden',
        message: result.message,
      });
    }
    req.session.flashError = result.message;
  } else {
    req.session.flashSuccess = 'Announcement published!';
  }

  res.redirect(`/trainer/sessions/${sessionId}/attendance`);
});
