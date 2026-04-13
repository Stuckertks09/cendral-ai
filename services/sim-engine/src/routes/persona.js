// routes/persona.js
import express from 'express';

export default function personaRoutes(personaFactory) {
  const router = express.Router();

  // GET /api/personas
  router.get('/', async (req, res) => {
    try {
      const list = await personaFactory.list();
      res.json(list);
    } catch (err) {
      console.error('❌ persona list error', err);
      res.status(500).json({ error: 'Failed to list personas' });
    }
  });

  // POST /api/personas
  router.post('/', async (req, res) => {
    try {
      const persona = await personaFactory.create(req.body);
      res.json(persona);
    } catch (err) {
      console.error('❌ persona create error', err);
      res.status(500).json({ error: 'Failed to create persona' });
    }
  });

  // GET /api/personas/:id
  router.get('/:id', async (req, res) => {
    try {
      const item = await personaFactory.get(req.params.id);
      if (!item) return res.status(404).json({ error: 'Not found' });
      res.json(item);
    } catch (err) {
      console.error('❌ persona get error', err);
      res.status(500).json({ error: 'Failed to fetch persona' });
    }
  });

  return router;
}
