import { Router, type Request, type Response } from 'express';
import { requireRole } from '../middleware/requireRole.js';
import { listLearnerEnrollments } from '../services/enrollment.js';

export const learnerRouter = Router();

learnerRouter.use(requireRole('learner'));

learnerRouter.get('/my-sessions', async (req: Request, res: Response) => {
  const learnerId = req.currentUser!.id;
  const enrollments = await listLearnerEnrollments(learnerId);

  res.render('pages/learner/my-sessions.njk', {
    pageTitle: 'My Workshop Sessions - Workshop House',
    enrollments,
  });
});
