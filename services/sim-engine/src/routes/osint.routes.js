import express from "express";
import {
  listFeeds,
  createFeed,
  updateFeed,
  deleteFeed,
  ingestNow,
  inbox,
  dismissSignal,
} from "../controllers/osint.controller.js";

const router = express.Router();

router.get("/feeds", listFeeds);
router.post("/feeds", createFeed);
router.patch("/feeds/:id", updateFeed);
router.delete("/feeds/:id", deleteFeed);

router.post("/ingest", ingestNow);
router.get("/inbox", inbox);
router.post("/signals/:id/dismiss", dismissSignal);

export default router;
