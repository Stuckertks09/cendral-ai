// src/routes/scenarios.js
import express from 'express';
import {
  listScenarios,
  getScenario,
  createScenario,
  updateScenario,
  deleteScenario,
} from '../controllers/scenarioController.js';

const router = express.Router();

// GET /api/scenarios
router.get('/', listScenarios);

// GET /api/scenarios/:id
router.get('/:id', getScenario);

// POST /api/scenarios
router.post('/', createScenario);

// PUT /api/scenarios/:id
router.put('/:id', updateScenario);

// DELETE /api/scenarios/:id (soft delete)
router.delete('/:id', deleteScenario);

export default router;