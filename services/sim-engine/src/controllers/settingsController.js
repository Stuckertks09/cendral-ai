// src/controllers/settingsController.js
import CognitionSettings, {
  getOrCreateCognitionSettings
} from "../core/cognition/CoreSettings.js";

import SystemSettings, {
  getOrCreateSystemSettings
} from "../core/systems/systemSettings.js";

import MemorySettings, {
  getOrCreateMemorySettings
} from "../models/MemorySettings.js"; // 🔹 new

// Existing: update in-memory registry
export const updateSettings = async (req, res) => {
  try {
    const { newSettings } = req.body;
    if (req.systemRegistry && typeof req.systemRegistry.updateSettings === "function") {
      req.systemRegistry.updateSettings(newSettings);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Settings update error", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ success: false, error: message });
  }
};

// ─────────────────────────────────────────────────────────────
// COGNITION SETTINGS
// ─────────────────────────────────────────────────────────────

export const getCognitionSettings = async (req, res) => {
  try {
    const doc = await getOrCreateCognitionSettings();
    const plain = doc.toObject();

    if (req.systemRegistry && typeof req.systemRegistry.updateSettings === "function") {
      req.systemRegistry.updateSettings({ cognition: plain });
    }

    res.json(plain);
  } catch (err) {
    console.error("❌ getCognitionSettings error", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ success: false, error: message });
  }
};

export const saveCognitionSettings = async (req, res) => {
  try {
    const payload = req.body || {};

    let doc = await CognitionSettings.findOne();
    if (!doc) {
      doc = new CognitionSettings({});
    }

    doc.set(payload); // schema enforces allowed fields
    await doc.save();

    const plain = doc.toObject();

    if (req.systemRegistry && typeof req.systemRegistry.updateSettings === "function") {
      req.systemRegistry.updateSettings({ cognition: plain });
    }

    res.json(plain);
  } catch (err) {
    console.error("❌ saveCognitionSettings error", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ success: false, error: message });
  }
};

// ─────────────────────────────────────────────────────────────
// SYSTEM SETTINGS (economic / environment / info / population)
// ─────────────────────────────────────────────────────────────

export const getSystemSettings = async (req, res) => {
  try {
    const doc = await getOrCreateSystemSettings();
    const plain = doc.toObject();

    if (req.systemRegistry && typeof req.systemRegistry.updateSettings === "function") {
      req.systemRegistry.updateSettings({
        EconomicSystem: plain.economic,
        EnvironmentSystem: plain.environment,
        InfoFlowSystem: plain.info,
        PopulationSystem: plain.population
      });
    }

    res.json(plain);
  } catch (err) {
    console.error("❌ getSystemSettings error", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ success: false, error: message });
  }
};

export const saveSystemSettings = async (req, res) => {
  try {
    const payload = req.body || {};

    let doc = await SystemSettings.findOne();
    if (!doc) {
      doc = new SystemSettings({});
    }

    const next = {
      economic: payload.economic ?? doc.economic,
      environment: payload.environment ?? doc.environment,
      info: payload.info ?? doc.info,
      population: payload.population ?? doc.population
    };

    doc.set(next);
    await doc.save();

    const plain = doc.toObject();

    if (req.systemRegistry && typeof req.systemRegistry.updateSettings === "function") {
      req.systemRegistry.updateSettings({
        EconomicSystem: plain.economic,
        EnvironmentSystem: plain.environment,
        InfoFlowSystem: plain.info,
        PopulationSystem: plain.population
      });
    }

    res.json(plain);
  } catch (err) {
    console.error("❌ saveSystemSettings error", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ success: false, error: message });
  }
};

// ─────────────────────────────────────────────────────────────
// MEMORY SETTINGS (semantic / graph / episodic controls)
// ─────────────────────────────────────────────────────────────

export const getMemorySettings = async (req, res) => {
  try {
    const doc = await getOrCreateMemorySettings();
    const plain = doc.toObject();

    if (req.systemRegistry && typeof req.systemRegistry.updateSettings === "function") {
      // you can read this later as systemRegistry.settings.memory, etc.
      req.systemRegistry.updateSettings({ memory: plain });
    }

    res.json(plain);
  } catch (err) {
    console.error("❌ getMemorySettings error", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ success: false, error: message });
  }
};

export const saveMemorySettings = async (req, res) => {
  try {
    const payload = req.body || {};

    let doc = await MemorySettings.findOne();
    if (!doc) {
      doc = new MemorySettings({});
    }

    // schema keeps us safe
    doc.set(payload);
    await doc.save();

    const plain = doc.toObject();

    if (req.systemRegistry && typeof req.systemRegistry.updateSettings === "function") {
      req.systemRegistry.updateSettings({ memory: plain });
    }

    res.json(plain);
  } catch (err) {
    console.error("❌ saveMemorySettings error", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ success: false, error: message });
  }
};
