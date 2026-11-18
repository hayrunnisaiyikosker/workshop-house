import { Router, type Request, type Response } from 'express';
import { requireRole } from '../middleware/requireRole.js';
import { listLearnerEnrollments } from '../services/enrollment.js';
import { generateQRCodeSvg } from '../services/qr.js';

export const learnerRouter = Router();

learnerRouter.use(requireRole('learner'));

learnerRouter.get('/my-sessions', async (req: Request, res: Response) => {
  const learnerId = req.currentUser!.id;
  const enrollments = await listLearnerEnrollments(learnerId);

  // Generate SVG QR codes for active enrollments
  const items = await Promise.all(
    enrollments.map(async (e) => {
      let qrSvg: string | null = null;
      if (e.status === 'active' && e.checkin_code) {
        qrSvg = await generateQRCodeSvg(e.checkin_code);
      }
      return {
        ...e,
        qr_svg: qrSvg,
      };
    })
  );

  res.render('pages/learner/my-sessions.njk', {
    pageTitle: 'My Workshop Sessions - Workshop House',
    enrollments: items,
  });
});
