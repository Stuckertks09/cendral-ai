// src/routes/coreAssets.js
import express from "express";
import {
  listAssets,
  getAsset,
  updateAsset,
} from "../controllers/coreAssets/index.js";

const router = express.Router();

/**
 * GET /api/core-assets?type=persona|actor|leader
 */
router.get("/", listAssets);

/**
 * GET /api/core-assets/:type/:id
 */
router.get("/:type/:id", getAsset);

/**
 * PATCH /api/core-assets/:type/:id
 */
router.patch("/:type/:id", updateAsset);

export default router;
