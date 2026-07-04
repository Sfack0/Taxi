import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import rideRoutes from './ride.routes';
import carouselRoutes from './carousel.routes';
import pricingRoutes from './pricing.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/rides', rideRoutes);
router.use('/carousel', carouselRoutes);
router.use('/pricing', pricingRoutes);

// TEMP: deploy marker so the test-booking flow can detect when this build is live.
router.get('/version', (_req, res) => {
  res.json({ v: 'test-suppress-3' });
});

// TEMP: diagnostic — calls Brevo directly and returns the raw result/error.
router.get('/emailtest', async (_req, res) => {
  const key = process.env.BREVO_API_KEY;
  const sender = process.env.BREVO_SENDER_EMAIL || 'noreply@crete-taxivan.gr';
  try {
    const r = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': key || '', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: { name: 'CTS diagnostic', email: sender },
        to: [{ email: 'giannis2001.gs@gmail.com' }],
        subject: 'CTS Brevo diagnostic',
        htmlContent: '<p>diagnostic ok</p>',
        textContent: 'diagnostic ok',
      }),
    });
    const body = await r.text();
    res.json({
      hasKey: !!key,
      keyPrefix: key ? key.slice(0, 10) : null,
      sender,
      emailEnabled: process.env.EMAIL_ENABLED,
      brevoStatus: r.status,
      brevoOk: r.ok,
      brevoBody: body.slice(0, 600),
    });
  } catch (e) {
    res.json({ hasKey: !!key, sender, error: String(e) });
  }
});

export default router;
