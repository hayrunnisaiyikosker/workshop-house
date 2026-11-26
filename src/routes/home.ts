import { Router, type Request, type Response } from 'express';
import { listSessions } from '../services/sessions.js';

export const homeRouter = Router();

homeRouter.get('/', async (req: Request, res: Response) => {
  const currentUserId = req.currentUser?.id;
  const allSessions = await listSessions(currentUserId);
  // Show only future/ongoing sessions on homepage, soonest first
  const now = new Date();
  const upcoming = allSessions
    .filter((s) => new Date(s.ends_at) >= now)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());

  res.render('pages/home.njk', {
    pageTitle: 'Home - Workshop House',
    sessions: upcoming,
  });
});
