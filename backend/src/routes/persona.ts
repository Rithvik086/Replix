import express from 'express';

// This route file used to provide a runtime persona API. It has been deprecated
// and retained as a placeholder to avoid breaking imports during incremental
// rollbacks. The route now returns 404 for all requests.

const router = express.Router();

router.all('*', (_req, res) => {
  res.status(404).json({ success: false, message: 'deprecated' });
});

export default router;
