import { Router, type Request, type Response } from 'express';
import { requireRole } from '../middleware/requireRole.js';

export const homeRouter = Router();

homeRouter.get('/', (_req: Request, res: Response) => {
  res.render('pages/home.njk', {
    pageTitle: 'Home - Workshop House',
  });
});

// Role-protected test routes for Phase 1 verification
homeRouter.get('/coordinator/sessions', requireRole('coordinator'), (_req: Request, res: Response) => {
  res.send('<h1>Coordinator Area</h1>');
});

homeRouter.get('/trainer/sessions', requireRole('trainer'), (_req: Request, res: Response) => {
  res.send('<h1>Trainer Area</h1>');
});

homeRouter.get('/my-sessions', requireRole('learner'), (_req: Request, res: Response) => {
  res.send('<h1>Learner Area</h1>');
});
