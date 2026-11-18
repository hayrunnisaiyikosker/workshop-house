import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { preferencesSchema } from '../validation/preferences.js';
import { formatZodErrors } from '../a11y/errors.js';
import { getUserPreferences, updateUserPreferences } from '../services/preferences.js';

export const preferencesRouter = Router();

preferencesRouter.use(requireAuth);

preferencesRouter.get('/', async (req: Request, res: Response) => {
  const userId = req.currentUser!.id;
  const preferences = await getUserPreferences(userId);

  res.render('pages/preferences.njk', {
    pageTitle: 'User Preferences & Accessibility - Workshop House',
    values: preferences,
  });
});

preferencesRouter.post('/', async (req: Request, res: Response) => {
  const userId = req.currentUser!.id;
  const parseResult = preferencesSchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(422);
    return res.render('pages/preferences.njk', {
      pageTitle: 'User Preferences & Accessibility - Workshop House',
      values: req.body,
      errors: formatZodErrors(parseResult.error),
    });
  }

  const updated = await updateUserPreferences(userId, parseResult.data);
  if (req.currentUser) {
    req.currentUser.preferences = updated;
  }

  req.session.flashSuccess = 'Your accessibility and display preferences have been saved.';
  res.redirect('/preferences');
});
