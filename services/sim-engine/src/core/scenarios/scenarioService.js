// src/core/scenarios/scenarioService.js
import ScenarioModel from './CoreScenarios.js';

/**
 * Load a scenario with populated Event refs.
 */
export async function loadScenarioWithEvents(idOrSlug) {
  const query = idOrSlug.match(/^[0-9a-fA-F]{24}$/)
    ? { _id: idOrSlug }
    : { slug: idOrSlug };

  const scenario = await ScenarioModel.findOne(query)
    .populate('events.eventId')
    .lean();

  return scenario;
}

/**
 * Build a simple injection timeline from a scenario.
 * Output shape:
 * [
 *   { stepIndex: number, label, description, event }
 * ]
 */
export function buildInjectionTimeline(scenario) {
  if (!scenario || !Array.isArray(scenario.events)) return [];

  return scenario.events
    .map((step) => {
      const injectAtStep =
        typeof step.injectAtStep === 'number'
          ? step.injectAtStep
          : step.order || 0;

      const eventPayload =
        step.inlineEvent || step.eventId || null;

      if (!eventPayload) return null;

      return {
        stepIndex: injectAtStep,
        label: step.label,
        description: step.description,
        tags: step.tags || [],
        event: eventPayload,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.stepIndex - b.stepIndex);
}
