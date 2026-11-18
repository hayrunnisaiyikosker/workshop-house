import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getDashboardMetrics } from '../services/dashboard.js';

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

dashboardRouter.get('/', async (req: Request, res: Response) => {
  const userId = req.currentUser!.id;
  const userRole = req.currentUser!.role;

  const metrics = await getDashboardMetrics(userId, userRole);

  res.render('pages/dashboard.njk', {
    pageTitle: 'Operational Dashboard - Workshop House',
    metrics,
  });
});
