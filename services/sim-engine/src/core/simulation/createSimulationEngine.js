// src/core/simulation/createSimulationEngine.js
import SystemRegistry from "../systems/SystemRegistry.js";

import EconomicSystem from "../systems/EconomicSystem.js";
import EnvironmentSystem from "../systems/EnvironmentSystem.js";
import InfoFlowSystem from "../systems/InfoFlowSystem.js";
import PopulationSystem from "../systems/PopulationSystem.js";

import CoreWorldState from "../world/CoreWorldState.js";
import { createInitialWorldState } from "./createInitialWorldState.js";
import SimulationEngine from "./SimulationEngine.js";

/**
 * Create a fully isolated simulation engine
 * from a frozen ConfigPackage.
 */
export async function createSimulationEngine({
  configPackage,
  runId,
}) {
  if (!configPackage) {
    throw new Error("createSimulationEngine requires configPackage");
  }

  if (!runId) {
    throw new Error("createSimulationEngine requires runId");
  }

  // --- BASELINE WORLD STATE (step 0) ---
  const baseline = createInitialWorldState({
    runId,
    configPackage,
    domains: configPackage.domains,
  });

  // Persist step 0
  await CoreWorldState.create(baseline);

  // --- SYSTEM REGISTRY ---
  const registry = new SystemRegistry({
    worldState: baseline,
    settings: configPackage.systems || {},
  });

  registry
    .register(EconomicSystem)
    .register(EnvironmentSystem)
    .register(InfoFlowSystem)
    .register(PopulationSystem);

  // Enable / disable systems
  if (Array.isArray(configPackage.enabledSystems)) {
    for (const { name } of registry.systems) {
      if (!configPackage.enabledSystems.includes(name)) {
        registry.disable(name);
      }
    }
  }

  // --- SIM ENGINE ---
  const simEngine = new SimulationEngine({
    worldState: baseline,
    systemRegistry: registry,
    cognitionSettings: configPackage.cognition,
    memorySettings: configPackage.memory,
    runId,
  });

  return simEngine;
}
