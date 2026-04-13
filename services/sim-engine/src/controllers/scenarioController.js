// src/controllers/scenarioController.js
import ScenarioModel from '../core/scenarios/CoreScenarios.js';
import { loadScenarioWithEvents, buildInjectionTimeline } from '../core/scenarios/scenarioService.js';

/**
 * GET /api/scenarios
 * Query:
 *  - domain
 *  - active (true/false)
 *  - search (name/description)
 *  - tag
 *  - limit
 */
export async function listScenarios(req, res) {
  try {
    const {
      domain,
      active,
      search,
      tag,
      limit: limitRaw,
    } = req.query;

    const query = {};

    if (domain) query.domain = domain;

    if (typeof active === 'string') {
      const isActive = active.toLowerCase() === 'true';
      query.isActive = isActive;
    }

    if (tag) {
      query.tags = tag;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const rx = new RegExp(search.trim(), 'i');
      query.$or = [{ name: rx }, { description: rx }];
    }

    const limit =
      typeof limitRaw === 'string'
        ? Math.min(parseInt(limitRaw, 10) || 100, 300)
        : 100;

    const scenarios = await ScenarioModel.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json(scenarios);
  } catch (err) {
    console.error('❌ listScenarios error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}

/**
 * GET /api/scenarios/:id
 * Optional query: ?includeTimeline=true
 */
export async function getScenario(req, res) {
  try {
    const { id } = req.params;
    const { includeTimeline } = req.query;

    const scenario = await loadScenarioWithEvents(id);

    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found' });
    }

    if (
      includeTimeline &&
      includeTimeline.toString().toLowerCase() === 'true'
    ) {
      const timeline = buildInjectionTimeline(scenario);
      return res.json({ scenario, timeline });
    }

    res.json(scenario);
  } catch (err) {
    console.error('❌ getScenario error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}

/**
 * POST /api/scenarios
 * Body:
 *  - name (required)
 *  - optional: description, domain, tags, runConfig, events[]
 */
export async function createScenario(req, res) {
  try {
    const payload = req.body || {};

    if (!payload.name) {
      return res
        .status(400)
        .json({ error: 'Scenario name is required' });
    }

    // basic normalization on events order/injectAtStep
    if (Array.isArray(payload.events)) {
      payload.events = payload.events.map((e, idx) => ({
        order:
          typeof e.order === 'number'
            ? e.order
            : idx,
        injectAtStep:
          typeof e.injectAtStep === 'number'
            ? e.injectAtStep
            : e.order ?? idx,
        label: e.label,
        description: e.description,
        eventId: e.eventId,
        inlineEvent: e.inlineEvent,
        tags: e.tags || [],
      }));
    }

    const scenario = await ScenarioModel.create(payload);
    res.json({ success: true, scenario });
  } catch (err) {
    console.error('❌ createScenario error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: message });
  }
}

/**
 * PUT /api/scenarios/:id
 * Partial update
 */
export async function updateScenario(req, res) {
  try {
    const { id } = req.params;
    const payload = req.body || {};

    const scenario = await ScenarioModel.findById(id);
    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found' });
    }

    // Allow full replacement of events array
    if (Array.isArray(payload.events)) {
      scenario.events = payload.events.map((e, idx) => ({
        order:
          typeof e.order === 'number'
            ? e.order
            : idx,
        injectAtStep:
          typeof e.injectAtStep === 'number'
            ? e.injectAtStep
            : e.order ?? idx,
        label: e.label,
        description: e.description,
        eventId: e.eventId,
        inlineEvent: e.inlineEvent,
        tags: e.tags || [],
      }));
      delete payload.events;
    }

    Object.assign(scenario, payload);
    await scenario.save();

    res.json({ success: true, scenario });
  } catch (err) {
    console.error('❌ updateScenario error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: message });
  }
}

/**
 * DELETE /api/scenarios/:id
 * Soft delete (archive)
 */
export async function deleteScenario(req, res) {
  try {
    const { id } = req.params;

    const scenario = await ScenarioModel.findById(id);
    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found' });
    }

    scenario.isActive = false;
    scenario.archivedAt = new Date();
    await scenario.save();

    res.json({ success: true });
  } catch (err) {
    console.error('❌ deleteScenario error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: message });
  }
}
