import { Router, type Request, type Response } from 'express';
import { requireRole } from '../middleware/requireRole.js';
import { trainerResourceSchema } from '../validation/sessions.js';
import { listTrainerSessions, updateTrainerResource } from '../services/sessions.js';

export const trainerRouter = Router();

trainerRouter.use(requireRole('trainer'));

trainerRouter.get('/sessions', async (req: Request, res: Response) => {
  const trainerId = req.currentUser!.id;
  const sessions = await listTrainerSessions(trainerId);

  res.render('pages/trainer/sessions.njk', {
    pageTitle: 'My Assigned Sessions - Trainer Dashboard',
    sessions,
  });
});

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
