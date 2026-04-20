import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import {
  createCoach,
  deleteCoach,
  getAllCoaches,
  getCoachById,
  updateCoach,
} from "../controllers/coachController.js";

const router = Router();

/* ================= 🔥 MULTER CONFIG ================= */

// 📁 folder
const uploadDir = "uploads/coaches";

// إنشاء الفولدر لو مش موجود
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 📦 storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = file.originalname
      .replace(ext, "")
      .replace(/\s+/g, "-");

    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(null, `${name}-${unique}${ext}`);
  },
});

// 🛑 images only
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

// ✅ create (image optional)
router.post("/", upload.single("image"), createCoach);

// ✅ update (image optional)
router.put("/:id", upload.single("image"), updateCoach);

// GET
router.get("/", getAllCoaches);
router.get("/:id", getCoachById);

// DELETE
router.delete("/:id", deleteCoach);

export default router;