// src/controllers/simController.js
export const getState = async (req, res) => {
  try {
    const state = await req.simService.getState();
    res.json({ success: true, state });
  } catch (err) {
    console.error("❌ getState error", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const resetSimulation = async (req, res) => {
  try {
    const state = await req.simService.reset(req.body?.event || null);
    res.json({ success: true, state });
  } catch (err) {
    console.error("❌ reset error", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const stepSimulation = async (req, res) => {
  try {
    const event = req.body?.event || null;
    const next = await req.simService.step(event);
    res.json({ success: true, state: next });
  } catch (err) {
    console.error("❌ step error", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getHistory = async (req, res) => {
  try {
    const history = await req.simService.worldStateManager.listHistory();
    res.json({ success: true, history });
  } catch (err) {
    console.error("❌ history error", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
