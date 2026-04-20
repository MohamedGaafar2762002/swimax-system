import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import {
  createTrainee,
  deleteTrainee,
  getAllTrainees,
  getTraineeById,
  updateTrainee,
} from "../controllers/traineeController.js";

const router = Router();

/* ================= 🔥 MULTER CONFIG ================= */

// 📁 فولدر الصور
const uploadDir = "uploads/trainees";

// نتأكد إنه موجود
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ⚙️ storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = file.originalname.replace(ext, "").replace(/\s+/g, "-");
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${name}-${unique}${ext}`);
  },
});

// 🎯 images only
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
});

/* ================= ROUTES ================= */

// 🔥 create (image optional)
router.post("/", upload.single("image"), createTrainee);

// 🔥 update (image optional)
router.put("/:id", upload.single("image"), updateTrainee);

router.get("/", getAllTrainees);
router.get("/:id", getTraineeById);
router.delete("/:id", deleteTrainee);

export default router;