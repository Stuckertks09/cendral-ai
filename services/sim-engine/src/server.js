// server.js
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';


dotenv.config();


/* -------------------------------------------------------
   LOAD EXTENSIONS
------------------------------------------------------- */
import LlmClient from './core/llm/LlmClient.js';
import personaExtensions from './extensions/index.js';
import rawWorldExtensions from './core/world/extensions/index.js';
import PineconeMemory from './memory/semantic/PineconeMemory.js';
import GraphMemory from './memory/relational/GraphMemory.js';

console.log("WORLD EXTENSION KEYS:", Object.keys(rawWorldExtensions));

/* -------------------------------------------------------
   FACTORIES
------------------------------------------------------- */
import PersonaFactory from './core/persona/PersonaFactory.js';
import WorldStateFactory from './core/world/WorldStateFactory.js';

/* -------------------------------------------------------
   SYSTEMS
------------------------------------------------------- */
import SystemRegistry from './core/systems/SystemRegistry.js';
import EconomicSystem from './core/systems/EconomicSystem.js';
import EnvironmentSystem from './core/systems/EnvironmentSystem.js';
import InfoFlowSystem from './core/systems/InfoFlowSystem.js';
import PopulationSystem from './core/systems/PopulationSystem.js';
import SimulationService from './services/SimulationService.js';
import ArbitrationEngine from './arbitration/ArbritrationEngine.js';
import SimulationEngine from "./core/simulation/SimulationEngine.js";


/* -------------------------------------------------------
   ROUTES
------------------------------------------------------- */
import personaRoutes from './routes/persona.js';
import worldRoutes from './routes/worldRoutes.js';
import simulationRoutes from './routes/sim.js';
import simControlRoutes from './routes/simControl.js';
import eventRoutes from './routes/event.js';
import settingsRoutes from './routes/settings.js';
import runCompleteRoute from "./routes/runComplete.js";
import startRunRoute from './routes/startRun.js';
import cognitionRoutes from "./routes/cognitionRoutes.js";
import relationshipRoutes from "./routes/relationships.js";
import pineconeRoutes from "./routes/pinecone.js";
import defenseRoutes from "./routes/defenseRoutes.js";
import coreAssetsRoutes from "./routes/coreAssets.js";
import scenarioRoutes from './routes/scenarios.js';
import osintRoutes from "./routes/osint.routes.js";
import configPackageRoutes from "./routes/configPackageRoutes.js";

/* -------------------------------------------------------
   APP SETUP
------------------------------------------------------- */
const app = express();
app.use(express.json());

/* -------------------------------------------------------
   CORS (allow Studio UI <-> API)
------------------------------------------------------- */
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: false
  })
);

/* -------------------------------------------------------
   DB CONNECTION
------------------------------------------------------- */
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.MONGO_DB || 'agent_platform'
    });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
}

/* -------------------------------------------------------
   WORLD EXTENSIONS → Flatten & Validate
------------------------------------------------------- */
const worldExtensions = Object.entries(rawWorldExtensions)
  .map(([name, ext]) => {
    if (!ext.worldState) {
      console.warn(`⚠️ World extension "${name}" has no worldState. Skipped.`);
      return null;
    }
    return {
      name,
      worldState: ext.worldState,
      worldStateAdapter: ext.worldStateAdapter || null
    };
  })
  .filter(Boolean);

/* -------------------------------------------------------
   INIT FACTORIES
------------------------------------------------------- */
let graphMemory = null;
let semanticMemory = null;
let personaFactory;
let worldStateFactory;

function initializeFactories() {
  console.log('🔧 Initializing PersonaFactory...');
  personaFactory = new PersonaFactory(personaExtensions);

  console.log('🌍 Initializing WorldStateFactory...');
  worldStateFactory = new WorldStateFactory(worldExtensions);
  worldStateFactory.buildSchema();

  console.log('🚀 Factories initialized');
}

/* -------------------------------------------------------
   INIT SYSTEMS
------------------------------------------------------- */
let systemRegistry;
let simService;

function initializeSystems() {
  systemRegistry = new SystemRegistry({
    worldState: null,
    settings: {}
  });

  systemRegistry
    .register(EconomicSystem)
    .register(EnvironmentSystem)
    .register(InfoFlowSystem)
    .register(PopulationSystem);
}

function initializeSimulationService() {
  simService = new SimulationService({
    personaFactory,
    worldStateFactory,
    systemRegistry
  });
}

let llmClient;

function initializeLlmClient() {
  llmClient = new LlmClient({
    apiKey: process.env.OPENAI_API_KEY,
    model: "gpt-4.1-mini"   // or allow override later
  });
}

async function initializeMemory() {
  semanticMemory = new PineconeMemory();

  console.log("🧠 Initializing semantic + relational memory...");
  await semanticMemory.init();

  console.log("✅ Memory systems ready");
}

async function initializeGraphMemory() {
  console.log("🕸️ Initializing graph memory...");
  graphMemory = new GraphMemory();
  await graphMemory.init();   // runs test query
  console.log("✅ Graph memory ready");
}


/* -------------------------------------------------------
   ARBITRATION ENGINE
------------------------------------------------------- */

let arbitrationEngine;

function initializeArbitrationEngine() {
  arbitrationEngine = new ArbitrationEngine({
    llm: llmClient,
    domainExtensions: rawWorldExtensions
  });
}

let simEngine;

function initializeSimulationEngine() {
  simEngine = new SimulationEngine({
    extensions: worldExtensions,
    openai: llmClient.raw,    // ALWAYS the raw OpenAI client
    semanticMemory,
    graphMemory,
    personaRules: [],         // sliders later
    personaSettings: {}       // sliders later
  });
  console.log("🧠 SimulationEngine initialized");
}



/* -------------------------------------------------------
   REGISTER ROUTES (AFTER ALL INIT)
------------------------------------------------------- */
function registerRoutes() {
  app.use('/api/personas', personaRoutes(personaFactory));
  app.use('/api/world', worldRoutes(worldStateFactory));
  app
  app.use(
  "/api/sim",
  runCompleteRoute({
    simService,
    personaFactory,
    arbitrationEngine,
    systemRegistry
  })
);
app.use(
  "/api/cognition",
  cognitionRoutes({
    simEngine,
    llmClient,
  })
);

app.use("/api/sim", startRunRoute({ simService }));
app.use("/api/core-assets", coreAssetsRoutes);
app.use("/api/config-packages", configPackageRoutes);
app.use("/api/osint", osintRoutes);
app.use("/", defenseRoutes);

  // simControl requires simService & systemRegistry
  app.use('/api/sim', simControlRoutes(simService, systemRegistry));

  // simulationRoutes requires worldStateFactory only
  app.use('/api/sim', simulationRoutes({ simEngine }));
  app.use(
    "/api/pinecone",
    pineconeRoutes({ semanticMemory })
  );

  app.use('/api/events', eventRoutes);
  app.use('/api/settings', settingsRoutes(systemRegistry));
  app.use('/api/scenarios', scenarioRoutes);
  app.use(
  "/api/relationships",
  relationshipRoutes({
    llmClient,
    graphMemory
  })
);

  // health
  app.get('/', (req, res) => {
    res.json({
      status: 'ok',
      message: 'Agent Platform API running',
      endpoints: ['/api/personas', '/api/world', '/api/sim']
    });
  });
}

/* -------------------------------------------------------
   SERVER BOOTSTRAP
------------------------------------------------------- */
const PORT = process.env.PORT || 4000;

async function start() {
  await connectDB();
  initializeFactories();
  initializeSystems();
  initializeSimulationService();
  initializeLlmClient();
  initializeArbitrationEngine(); 
  initializeSimulationEngine();
  await initializeMemory();
  await initializeGraphMemory();
  registerRoutes();
  

  app.listen(PORT, () =>
    console.log(`🚀 Server listening on http://localhost:${PORT}`)
  );
}

start();
