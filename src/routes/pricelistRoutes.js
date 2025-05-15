import express from "express";
import {
  getAllPricelist,
  getPricelistById,
  createPricelist,
  updatePricelist,
  deletePricelist,
  createBulkPricelist,
  exportToCSV,
  importFromCSV,
} from "../controllers/pricelistController.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

// Validate ID middleware
const validateId = (req, res, next) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid ID format" });
  }
  req.validatedId = id;
  next();
};

router.get("/", getAllPricelist);
router.get("/:id", validateId, getPricelistById);
router.post("/", createPricelist);
router.post("/bulk", createBulkPricelist);
router.put("/:id", validateId, updatePricelist);
router.delete("/:id", validateId, deletePricelist);
router.get("/export/csv", exportToCSV);
router.post("/import/csv", upload.single("file"), importFromCSV);

export default router;
