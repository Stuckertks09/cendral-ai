// src/core/scenarios/scenarioSimulation.js
import mongoose from "mongoose";
import { createSimulationEngine } from "../simulation/createSimulationEngine.js";

/**
 * Run a full scenario with a specific ConfigPackage.
 * Produces a deterministic timeline of WorldStates.
 */
export async function runScenarioSimulation({
  scenario,
  configPackage,
  runId = null,
  maxSteps = null,
}) {
  if (!scenario) {
    throw new Error("runScenarioSimulation: scenario is required");
  }

  if (!configPackage) {
    throw new Error("runScenarioSimulation: configPackage is required");
  }

  const stepsDef = Array.isArray(scenario.events)
    ? scenario.events
    : Array.isArray(scenario.steps)
    ? scenario.steps
    : [];

  if (!stepsDef.length) {
    return { runId: "", steps: [] };
  }

  // Always generate a new runId unless explicitly replaying
  const effectiveRunId =
    runId && mongoose.Types.ObjectId.isValid(runId)
      ? new mongoose.Types.ObjectId(runId)
      : new mongoose.Types.ObjectId();

  // Create a NEW isolated simulation engine
  const simEngine = await createSimulationEngine({
    configPackage,
    runId: effectiveRunId,
  });

  // Deterministic ordering
  const orderedSteps = [...stepsDef].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );

  const executedWorldStates = [];
  let stepCount = 0;

  for (const step of orderedSteps) {
    if (maxSteps != null && stepCount >= maxSteps) break;
    if (step.disabled) continue;

    const eventPayload =
      step.inlineEvent || step.eventId || null;

    if (!eventPayload) continue;

    const worldState = await simEngine.runStep({
      event: eventPayload,
      runId: effectiveRunId,
    });

    executedWorldStates.push(worldState);
    stepCount += 1;
  }

  return {
    runId: effectiveRunId.toString(),
    scenarioId: scenario._id?.toString(),
    configPackageId: configPackage._id?.toString(),
    steps: executedWorldStates,
  };
}
