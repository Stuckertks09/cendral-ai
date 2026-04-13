// src/routes/configPackageRoutes.js
import express from "express";
import {
  createConfigPackage,
  listConfigPackages,
  getConfigPackage,
  cloneConfigPackage,
  deleteConfigPackage
} from "../controllers/configPackageController.js";

const router = express.Router();

router.post("/", createConfigPackage);
router.get("/", listConfigPackages);
router.get("/:id", getConfigPackage);
router.post("/:id/clone", cloneConfigPackage);
router.delete("/:id", deleteConfigPackage);

export default router;
