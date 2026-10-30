import type { Request, Response, NextFunction } from 'express';
import { getUserById, type AuthenticatedUser } from '../services/auth.js';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    flashSuccess?: string;
    flashError?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      currentUser?: AuthenticatedUser;
    }
  }
}

export async function populateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Flash messages handling
  if (req.session.flashSuccess) {
    res.locals['flashSuccess'] = req.session.flashSuccess;
    delete req.session.flashSuccess;
  }
  if (req.session.flashError) {
    res.locals['flashError'] = req.session.flashError;
    delete req.session.flashError;
  }

  const userId = req.session.userId;
  if (!userId) {
    res.locals['currentUser'] = null;
    return next();
  }

  try {
    const user = await getUserById(userId);
    if (user) {
      req.currentUser = user;
      res.locals['currentUser'] = user;
    } else {
      delete req.session.userId;
      res.locals['currentUser'] = null;
    }
    next();
  } catch (err) {
    next(err);
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.currentUser) {
    req.session.flashError = 'You must be signed in to access this page.';
    return res.redirect('/auth/login');
  }
  next();
}
