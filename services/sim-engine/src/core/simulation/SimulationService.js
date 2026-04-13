// src/core/simulation/SimulationService.js
import SimulationRun from './SimulationRun.js';
import EventModel from '../events/CoreEvents.js';
import CognitionModule from '../cognition/CognitionModule.js';
import CognitionSettings from '../cognition/CoreSettings.js';
import PersonaModel from '../persona/CorePersona.js';
import PersonaFactory from '../persona/PersonaFactory.js';

import DebateGenerator from '../../arbitration/DebateGenerator.js';
import ArbitrationEngine from '../../arbitration/ArbritrationEngine.js';

export default class SimulationService {
  /**
   * @param {Object} deps
   * @param {WorldStateFactory} deps.worldStateFactory
   * @param {LlmClient} deps.llm
   */
  constructor({ worldStateFactory, llm }) {
    this.worldStateFactory = worldStateFactory;
    this.llm = llm;

    this.debateGenerator = new DebateGenerator({ llm });
    this.arbitrator = new ArbitrationEngine({ llm });
  }

  /**
   * Run a simulation for a given event.
   *
   * @param {Object} params
   * @param {string} params.eventId
   * @param {number} params.steps
   * @param {Object} params.personaFilter - Mongo query for personas
   * @param {string} params.domain - e.g. "political"
   */
  async runSimulation({
    eventId,
    steps = 1,
    personaFilter = {},
    domain = 'political'
  }) {
    const event = await EventModel.findById(eventId);
    if (!event) throw new Error(`Event ${eventId} not found`);

    // load latest cognition settings (if any)
    const settingsDoc = await CognitionSettings.findOne().sort({ updatedAt: -1 });
    const settings = settingsDoc ? settingsDoc.toObject() : {};

    const run = await SimulationRun.create({
      eventId,
      mode: domain,
      settingsSnapshot: settings
    });

    // initial worldstate
    let worldState = await this.worldStateFactory.createInitialWorldState({
      runId: run._id,
      event
    });
    await worldState.save();

    const worldTimeline = [worldState];

    for (let step = 0; step < steps; step++) {
      // 1) Load personas + hydrate with extensions
      const personaDocs = await PersonaModel.find(personaFilter);
      const personas = personaDocs.map(doc => PersonaFactory.hydrateFromDocument(doc));

      // 2) Generate arguments for this event
      const argumentsList = await this.debateGenerator.generateArguments({
        personas,
        event
      });

      // 3) Clone worldstate for next step
      const nextWorldState = this.worldStateFactory.cloneWorldState(worldState);
      nextWorldState.stepIndex = step + 1;

      // 4) Arbitration updates world + personas (in-place)
      const arbitrationResult = await this.arbitrator.arbitrate({
        event,
        argumentsList,
        worldState: nextWorldState,
        personas,
        domain
      });

      // 5) Run cognition rules per persona AFTER arbitration drift
      const baseRules = []; // you’ll plug your rule packs in here

      for (const persona of personas) {
        const cognition = new CognitionModule({
          persona,
          worldState: nextWorldState,
          event,
          rules: baseRules,
          settings
        });

        cognition.run();
        await persona.save();
      }

      await nextWorldState.save();
      worldTimeline.push(nextWorldState);
      worldState = nextWorldState;

      // optional: attach arbitration metadata per step later if you want
      // e.g. push to SimulationRun subdoc
    }

    run.steps = steps;
    run.finishedAt = new Date();
    await run.save();

    return {
      runId: run._id,
      eventId,
      domain,
      steps,
      worldStates: worldTimeline.map(ws => ({
        id: ws._id,
        stepIndex: ws.stepIndex
      }))
    };
  }

  async getRun(runId) {
    const run = await SimulationRun.findById(runId);
    if (!run) return null;

    const WorldStateModel = this.worldStateFactory.WorldStateModel;
    const worldStates = await WorldStateModel.find({ runId }).sort({ stepIndex: 1 });

    return { run, worldStates };
  }
}
