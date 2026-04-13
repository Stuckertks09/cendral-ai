// src/routes/simControl.js
import express from 'express';
import {
  getState,
  resetSimulation,
  stepSimulation,
  getHistory
} from '../controllers/simController.js';

export default function simControlRoutes(simService, systemRegistry) {
  const router = express.Router();

  // inject services via middleware
  router.use((req, res, next) => {
    req.simService = simService;
    req.systemRegistry = systemRegistry;
    next();
  });

  router.get('/state', getState);
  router.post('/reset', resetSimulation);
  router.post('/step', stepSimulation);
  router.get('/history', getHistory);

  return router;
}
