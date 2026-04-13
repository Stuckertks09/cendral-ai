// src/routes/settings.js
import express from 'express';
import {
  updateSettings,
  getCognitionSettings,
  saveCognitionSettings,
  getSystemSettings,
  saveSystemSettings,
  getMemorySettings,     // 🔹 new
  saveMemorySettings     // 🔹 new
} from '../controllers/settingsController.js';

export default function settingsRoutes(systemRegistry) {
  const router = express.Router();

  router.use((req, res, next) => {
    req.systemRegistry = systemRegistry;
    next();
  });

  // Runtime / generic settings (existing behavior)
  router.post('/', updateSettings);

  // Cognition settings
  router.get('/cognition', getCognitionSettings);
  router.put('/cognition', saveCognitionSettings);

  // System settings
  router.get('/systems', getSystemSettings);
  router.put('/systems', saveSystemSettings);

  // Memory settings
  router.get('/memory', getMemorySettings);
  router.put('/memory', saveMemorySettings);

  return router;
}
