import cloudinary from "../config/cloudinary.js";
import Coach from "../models/Coach.js";

/**
 * 🟢 Create Coach
 */
export async function createCoach(req, res, next) {
  try {
    const data = {
      name: req.body.name,
      age: req.body.age,
      bio: req.body.bio,
    };

    if (req.file) {
      data.image = req.file.path; // URL
      data.imagePublicId = req.file.filename; // public_id
    }

    const coach = await Coach.create(data);

    res.status(201).json(coach);
  } catch (err) {
    next(err);
  }
}

/**
 * 🟢 Get All Coaches
 */
export async function getAllCoaches(req, res, next) {
  try {
    const coaches = await Coach.find().sort({ createdAt: -1 });
    res.json({
      coaches,
      totalItems: coaches.length,
      totalPages: 1,
      currentPage: 1,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 🟢 Get Coach By ID
 */
export async function getCoachById(req, res, next) {
  try {
    const coach = await Coach.findById(req.params.id);

    if (!coach) {
      return res.status(404).json({ message: "Coach not found" });
    }

    res.json(coach);
  } catch (err) {
    next(err);
  }
}

/**
 * 🟢 Update Coach
 */
export async function updateCoach(req, res, next) {
  try {
    const coach = await Coach.findById(req.params.id);

    if (!coach) {
      return res.status(404).json({ message: "Coach not found" });
    }

    // ✏️ update fields
    coach.name = req.body.name ?? coach.name;
    coach.age = req.body.age ?? coach.age;
    coach.bio = req.body.bio ?? coach.bio;

    // 🧨 لو فيه صورة جديدة
    if (req.file) {
      // احذف القديمة لو موجودة
      if (coach.imagePublicId) {
        await cloudinary.uploader.destroy(coach.imagePublicId);
      }

      coach.image = req.file.path;
      coach.imagePublicId = req.file.filename;
    }

    await coach.save();

    res.json(coach);
  } catch (err) {
    next(err);
  }
}

/**
 * 🟢 Delete Coach
 */
export async function deleteCoach(req, res, next) {
  try {
    const coach = await Coach.findById(req.params.id);

    if (!coach) {
      return res.status(404).json({ message: "Coach not found" });
    }

    // 🧨 احذف الصورة من Cloudinary
    if (coach.imagePublicId) {
      await cloudinary.uploader.destroy(coach.imagePublicId);
    }

    await coach.deleteOne();

    res.json({ message: "Coach deleted successfully" });
  } catch (err) {
    next(err);
  }
}
