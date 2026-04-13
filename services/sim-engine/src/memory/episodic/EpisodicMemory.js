import CoreWorldState from "../../core/world/CoreWorldState.js";
import ArbitrationLog from "../../models/ArbitrationLog.js";

export default class EpisodicMemory {
  async recentEvents(limit = 10) {
    return ArbitrationLog.find().sort({ timestamp: -1 }).limit(limit).lean();
  }

  async recentWorldStates(limit = 5) {
    return CoreWorldState.find().sort({ createdAt: -1 }).limit(limit).lean();
  }
}
