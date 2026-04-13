// src/controllers/eventController.js
import EventModel from '../core/events/CoreEvents.js';
import { determineSeverity } from '../core/events/eventSeverity.js';

/**
 * GET /api/events
 * Optional query params:
 *  - domain
 *  - type
 *  - topic
 *  - search (rawText / parsed.summary)
 *  - limit (default 200, max 500)
 */
export async function listEvents(req, res) {
  try {
    const { domain, type, topic, search, limit: limitRaw } = req.query;

    const query = {};

    if (domain) query.domain = domain;
    if (type) query.type = type;
    if (topic) query.topic = topic;

    if (typeof search === 'string' && search.trim().length > 0) {
      query.$or = [
        { rawText: { $regex: search, $options: 'i' } },
        { 'parsed.summary': { $regex: search, $options: 'i' } },
      ];
    }

    const limit =
      typeof limitRaw === 'string'
        ? Math.min(parseInt(limitRaw, 10) || 200, 500)
        : 200;

    const events = await EventModel.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    res.json(events);
  } catch (err) {
    console.error('❌ Event list error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}

/**
 * GET /api/events/:id
 */
export async function getEvent(req, res) {
  try {
    const { id } = req.params;

    const event = await EventModel.findById(id).lean();
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (err) {
    console.error('❌ Event get error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}

/**
 * POST /api/events
 *
 * Body can include:
 *  - type (required)
 *  - domain (optional; defaults to 'general')
 *  - topic, actor, target, theater, subTheater, category
 *  - rawText (required)
 *  - parsed (optional: summary, sentiment, keywords, entities)
 *  - source, tags
 *
 * Query:
 *  - autoSeverity=false to skip automatic severity analysis
 */
export async function createEvent(req, res) {
  try {
    const payload = req.body || {};
    const { autoSeverity } = req.query;

    if (!payload.type || !payload.rawText) {
      return res.status(400).json({
        error: 'type and rawText are required fields',
      });
    }

    // Only pick the fields we actually allow from the client
    const {
      type,
      domain,
      topic,
      actor,
      target,
      theater,
      subTheater,
      category,
      rawText,
      parsed,
      source,
      tags,
    } = payload;

    const baseEvent = {
      type,
      domain,
      topic,
      actor,
      target,
      theater,
      subTheater,
      category,
      rawText,
      parsed,
      source,
      tags,
    };

    const shouldAuto =
      (autoSeverity ?? 'true').toString().toLowerCase() !== 'false';

    let severity = null;
    let analysis = undefined;

    if (shouldAuto) {
      // TODO: wire real context & memory if/when you have them
      const context = null;
      const memory = null;

      const { magnitude, inputs, breakdown } = await determineSeverity({
        event: baseEvent,
        context,
        memory,
      });

      severity = magnitude;
      analysis = {
        severity: {
          magnitude,
          direction: breakdown.direction,
          inputs,
          sentiment: parsed?.sentiment ?? null,
          modelVersion: breakdown.modelVersion,
          computedAt: new Date(),
          ruleBasedSeverity: breakdown.ruleBasedSeverity,
          llmSeverity: breakdown.llmSeverity,
          llmWeight: breakdown.llmWeight,
          ruleWeight: breakdown.ruleWeight,
          noveltyScore: breakdown.noveltyScore,
          notes: breakdown.notes,
        },
      };
    }

    const docToCreate = {
      ...baseEvent,
      ...(severity !== null ? { severity } : {}),
      ...(analysis ? { analysis } : {}),
    };

    const event = await EventModel.create(docToCreate);
    res.json({ success: true, event });
  } catch (err) {
    console.error('❌ Event create error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: message });
  }
}

export async function previewEventSeverity(req, res) {
  try {
    const payload = req.body || {};

    if (!payload.type || !payload.rawText) {
      return res.status(400).json({
        error: 'type and rawText are required fields',
      });
    }

    const {
      type,
      domain,
      topic,
      actor,
      target,
      theater,
      subTheater,
      category,
      rawText,
      parsed,
    } = payload;

    const baseEvent = {
      type,
      domain,
      topic,
      actor,
      target,
      theater,
      subTheater,
      category,
      rawText,
      parsed,
    };

    // TODO: when you have global context, pass it in here
    const context = null;
    const memory = null;

    const { magnitude, inputs, breakdown } = await determineSeverity({
      event: baseEvent,
      context,
      memory,
    });

    const analysis = {
      severity: {
        magnitude,
        direction: breakdown.direction,
        inputs,
        sentiment: parsed?.sentiment ?? null,
        modelVersion: breakdown.modelVersion,
        computedAt: new Date(),
        ruleBasedSeverity: breakdown.ruleBasedSeverity,
        llmSeverity: breakdown.llmSeverity,
        llmWeight: breakdown.llmWeight,
        ruleWeight: breakdown.ruleWeight,
        noveltyScore: breakdown.noveltyScore,
        notes: breakdown.notes,
      },
    };

    return res.json({
      success: true,
      severity: magnitude,
      direction: breakdown.direction,
      analysis,
    });
  } catch (err) {
    console.error('❌ Event preview severity error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
