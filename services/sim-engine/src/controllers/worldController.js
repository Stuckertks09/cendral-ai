// src/controllers/worldController.js
import mongoose from 'mongoose';

export const listWorldStates = async (req, res) => {
  try {
    if (!req.worldFactory || typeof req.worldFactory.list !== 'function') {
      throw new Error('worldFactory.list is not available on req');
    }

    const list = await req.worldFactory.list();
    res.json(list);
  } catch (err) {
    console.error('❌ world list error', err);
    res.status(500).json({ error: 'Failed to list world states' });
  }
};

export const createWorldState = async (req, res) => {
  try {
    if (!req.worldFactory || typeof req.worldFactory.create !== 'function') {
      throw new Error('worldFactory.create is not available on req');
    }

    const state = await req.worldFactory.create(req.body || {});
    res.json(state);
  } catch (err) {
    console.error('❌ world create error', err);
    res.status(500).json({ error: 'Failed to create world state' });
  }
};

export const getRunWorldStates = async (req, res) => {
  try {
    const { runId } = req.params;

    if (!req.worldFactory || !req.worldFactory.WorldStateModel) {
      throw new Error('worldFactory.WorldStateModel is not available on req');
    }

    const WorldState = req.worldFactory.WorldStateModel;

    const steps = await WorldState.find({ runId })
      .sort({ stepIndex: 1 })
      .lean();

    if (!steps.length) {
      return res.json({
        runId,
        steps: [],
        domains: {},
      });
    }

    const domains = {
      defense: [],
      economic: [],
      political: [],
      therapeutic: [],
      marketing: [],
      game: [],
      content: [],
    };

    for (const ws of steps) {
      const base = {
        stepIndex: ws.stepIndex ?? 0,
        createdAt: ws.createdAt,
      };

      // 🔹 DEFENSE: include debug.defense so actor reasoning is available
      if (ws.defense || ws.debug?.defense) {
        domains.defense.push({
          ...base,
          state: ws.defense || {},
          debug: ws.debug?.defense || null,
        });
      }

      if (ws.economic) {
        domains.economic.push({
          ...base,
          state: ws.economic,
        });
      }

      if (ws.political) {
        domains.political.push({
          ...base,
          state: ws.political,
        });
      }

      if (ws.therapeutic) {
        domains.therapeutic.push({
          ...base,
          state: ws.therapeutic,
        });
      }

      if (ws.marketing) {
        domains.marketing.push({
          ...base,
          state: ws.marketing,
        });
      }

      if (ws.game) {
        domains.game.push({
          ...base,
          state: ws.game,
        });
      }

      if (ws.content) {
        domains.content.push({
          ...base,
          state: ws.content,
        });
      }
    }

    res.json({
      runId,
      steps,
      domains,
    });
  } catch (err) {
    console.error('❌ getRunWorldStates error', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
};
