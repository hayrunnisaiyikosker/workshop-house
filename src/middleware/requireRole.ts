import type { Request, Response, NextFunction } from 'express';
import type { UserRole } from '../services/auth.js';

export function requireRole(allowedRoles: UserRole | UserRole[]) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.currentUser) {
      req.session.flashError = 'You must be signed in to perform this action.';
      res.redirect('/auth/login');
      return;
    }

    if (!roles.includes(req.currentUser.role)) {
      res.status(403);
      if (req.accepts('html')) {
        res.render('pages/error.njk', {
          pageTitle: '403 Forbidden - Workshop House',
          statusCode: 403,
          title: 'Access Forbidden',
          message: `Your account role (${req.currentUser.role}) does not have permission to access this resource.`,
        });
        return;
      }
      res.json({ error: 'Forbidden: Insufficient permissions' });
      return;
    }

    next();
  };
}
