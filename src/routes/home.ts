import { Router, type Request, type Response } from 'express';

export const homeRouter = Router();

homeRouter.get('/', (_req: Request, res: Response) => {
  res.render('pages/home.njk', {
    pageTitle: 'Home - Workshop House',
  });
});
