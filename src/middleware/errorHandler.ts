import type { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Unhandled application error:', err);

  const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
  res.status(statusCode);

  if (req.accepts('html')) {
    res.render('pages/error.njk', {
      pageTitle: `${statusCode} Error - Workshop House`,
      statusCode,
      title: statusCode === 404 ? 'Page Not Found' : 'Internal Server Error',
      message:
        statusCode === 404
          ? 'The requested page could not be found.'
          : 'An unexpected server error occurred. Please try again later.',
    });
    return;
  }

  res.json({
    error: err.message || 'Internal Server Error',
    statusCode,
  });
}
