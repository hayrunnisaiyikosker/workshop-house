import { Router, type Request, type Response } from 'express';
import { loginSchema } from '../validation/auth.js';
import { authenticateUser } from '../services/auth.js';
import { formatZodErrors } from '../a11y/errors.js';

export const authRouter = Router();

authRouter.get('/login', (req: Request, res: Response) => {
  if (req.currentUser) {
    return res.redirect('/');
  }
  res.render('pages/login.njk', {
    pageTitle: 'Sign In - Workshop House',
    values: {},
  });
});

authRouter.post('/login', async (req: Request, res: Response) => {
  const parseResult = loginSchema.safeParse(req.body);

  if (!parseResult.success) {
    const errors = formatZodErrors(parseResult.error);
    res.status(422);
    return res.render('pages/login.njk', {
      pageTitle: 'Sign In - Workshop House',
      values: { email: typeof req.body.email === 'string' ? req.body.email : '' },
      errors,
    });
  }

  const user = await authenticateUser(parseResult.data);
  if (!user) {
    res.status(422);
    return res.render('pages/login.njk', {
      pageTitle: 'Sign In - Workshop House',
      values: { email: parseResult.data.email },
      errors: {
        summary: [
          {
            field: 'password',
            id: 'password-error',
            message: 'Invalid email or password. Please verify your credentials.',
          },
        ],
        byField: {
          password: {
            field: 'password',
            id: 'password-error',
            message: 'Invalid email or password.',
          },
        },
      },
    });
  }

  // Set session
  req.session.userId = user.id;
  req.session.flashSuccess = `Welcome back, ${user.name}!`;

  req.session.save((err) => {
    if (err) {
      console.error('Session save error:', err);
    }
    res.redirect('/');
  });
});

authRouter.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destroy error:', err);
    }
    res.clearCookie('connect.sid');
    res.redirect('/auth/login');
  });
});
