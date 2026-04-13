// src/routes/events.js
import express from 'express';
import {
  listEvents,
  getEvent,
  createEvent,
  previewEventSeverity
} from '../controllers/eventController.js';

const router = express.Router();

// GET /api/events  → list / filter events
router.get('/', listEvents);

// GET /api/events/:id → single event
router.get('/:id', getEvent);

// POST /api/events/preview-severity → compute severity only
router.post('/preview-severity', previewEventSeverity);

// POST /api/events  → ingest new event (raw + auto severity)
router.post('/', createEvent);

export default router;
