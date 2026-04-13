import mongoose from "mongoose";

const EnterpriseWorldStateSchema = new mongoose.Schema({
  orgHealth: { type: Number, default: 0.5 },
  conflictLevel: { type: Number, default: 0.2 },
  productivity: { type: Number, default: 0.5 },
  lastUpdated: { type: Number, default: Date.now }
});

export default EnterpriseWorldStateSchema;
