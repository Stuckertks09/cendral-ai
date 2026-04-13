import { Router } from "express";
import {
  getDefenseTopics,
  updateDefenseTopics,
} from "../controllers/defenseController.js";

const router = Router();

router.get("/defense/topics", getDefenseTopics);
router.post("/defense/topics", updateDefenseTopics);

export default router;
