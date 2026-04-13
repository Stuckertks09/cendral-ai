// src/controllers/configPackageController.js
import ConfigPackage from "../models/ConfigPackage.js";

/**
 * Create a new immutable ConfigPackage
 */
export async function createConfigPackage(req, res) {
  try {
    const {
      name,
      description,
      tags,
      parentPackageId,
      cognition,
      memory,
      systems,
      domains,
      enabledSystems,
      createdBy
    } = req.body;

    if (!name || !cognition || !memory || !systems) {
      return res.status(400).json({
        error: "name, cognition, memory, and systems are required"
      });
    }

    const pkg = await ConfigPackage.create({
      name,
      description,
      tags,
      parentPackageId,
      cognition,
      memory,
      systems,
      domains,
      enabledSystems,
      createdBy
    });

    return res.status(201).json(pkg);
  } catch (err) {
    console.error("createConfigPackage:", err);
    return res.status(500).json({ error: "Failed to create ConfigPackage" });
  }
}

/**
 * List active ConfigPackages
 */
export async function listConfigPackages(req, res) {
  try {
    const { tag, createdBy } = req.query;

    const query = {};
    if (tag) query.tags = tag;
    if (createdBy) query.createdBy = createdBy;

    const packages = await ConfigPackage.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return res.json(packages);
  } catch (err) {
    return res.status(500).json({ error: "Failed to list ConfigPackages" });
  }
}

/**
 * Get single ConfigPackage by id
 */
export async function getConfigPackage(req, res) {
  try {
    const pkg = await ConfigPackage.findById(req.params.id).lean();
    if (!pkg) {
      return res.status(404).json({ error: "ConfigPackage not found" });
    }
    return res.json(pkg);
  } catch {
    return res.status(400).json({ error: "Invalid ConfigPackage id" });
  }
}

/**
 * Clone an existing package (fork)
 */
export async function cloneConfigPackage(req, res) {
  try {
    const source = await ConfigPackage.findById(req.params.id);
    if (!source) {
      return res.status(404).json({ error: "Source package not found" });
    }

    const overrides = req.body || {};

    const cloned = await ConfigPackage.create({
      ...source.toObject(),
      _id: undefined,
      parentPackageId: source._id,
      name: overrides.name || `${source.name} v${source.version + 1}`,
      description: overrides.description ?? source.description,
      cognition: overrides.cognition ?? source.cognition,
      memory: overrides.memory ?? source.memory,
      systems: overrides.systems ?? source.systems,
      domains: overrides.domains ?? source.domains,
      enabledSystems: overrides.enabledSystems ?? source.enabledSystems,
      version: source.version + 1,
      createdAt: undefined
    });

    return res.status(201).json(cloned);
  } catch (err) {
    console.error("cloneConfigPackage:", err);
    return res.status(500).json({ error: "Failed to clone ConfigPackage" });
  }
}

/**
 * Hard delete (use sparingly)
 */
export async function deleteConfigPackage(req, res) {
  try {
    await ConfigPackage.findByIdAndDelete(req.params.id);
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: "Failed to delete ConfigPackage" });
  }
}
