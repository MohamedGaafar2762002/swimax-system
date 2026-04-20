import mongoose from "mongoose";
import Coach from "../models/Coach.js";
import { escapeRegex } from "../utils/escapeRegex.js";

const ALLOWED_SORT_FIELDS = ["name", "age", "totalWorkingHours", "createdAt"];
const MAX_PAGE_SIZE = 100;

function parseCoachPayload(body) {
  const { name, age, bio } = body ?? {};

  if (!name || String(name).trim() === "") {
    return { error: "Name is required" };
  }

  if (age === undefined || age === null || age === "") {
    return { error: "Age is required" };
  }

  const ageNum = Number(age);
  if (!Number.isFinite(ageNum) || ageNum < 0) {
    return { error: "Age must be a valid non-negative number" };
  }

  return {
    data: {
      name: String(name).trim(),
      age: ageNum,
      bio: bio ? String(bio) : "",
    },
  };
}

function invalidIdResponse(res) {
  return res.status(400).json({ message: "Invalid coach id" });
}

/* ================= CREATE ================= */

export async function createCoach(req, res, next) {
  try {
    const parsed = parseCoachPayload(req.body);
    if (parsed.error) {
      return res.status(400).json({ message: parsed.error });
    }

    // ✅ ثابت
    if (req.file) {
      parsed.data.image = `uploads/coaches/${req.file.filename}`;
    }

    const coach = await Coach.create(parsed.data);
    return res.status(201).json(coach);
  } catch (err) {
    return next(err);
  }
}

/* ================= GET ALL ================= */

export async function getAllCoaches(req, res, next) {
  try {
    const { search, sortBy, order } = req.query;

    const page = Math.max(1, parseInt(req.query.page || "1"));
    const limit = Math.min(MAX_PAGE_SIZE, parseInt(req.query.limit || "10"));

    const filter = {};

    if (search) {
      filter.name = {
        $regex: escapeRegex(search),
        $options: "i",
      };
    }

    const sortField = ALLOWED_SORT_FIELDS.includes(sortBy)
      ? sortBy
      : "createdAt";

    const sortOrder = order === "asc" ? 1 : -1;

    const totalItems = await Coach.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limit);

    const coaches = await Coach.find(filter)
      .sort({ [sortField]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return res.json({
      coaches,
      currentPage: page,
      totalPages,
      totalItems,
    });
  } catch (err) {
    return next(err);
  }
}

/* ================= GET BY ID ================= */

export async function getCoachById(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return invalidIdResponse(res);
    }

    const coach = await Coach.findById(id).lean();

    if (!coach) {
      return res.status(404).json({ message: "Coach not found" });
    }

    return res.json(coach);
  } catch (err) {
    return next(err);
  }
}

/* ================= UPDATE ================= */

export async function updateCoach(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return invalidIdResponse(res);
    }

    const parsed = parseCoachPayload(req.body);
    if (parsed.error) {
      return res.status(400).json({ message: parsed.error });
    }

    // ✅ نفس الشكل زي create
    if (req.file) {
      parsed.data.image = `uploads/coaches/${req.file.filename}`;
    }

    const coach = await Coach.findByIdAndUpdate(id, parsed.data, {
      new: true,
      runValidators: true,
    }).lean();

    if (!coach) {
      return res.status(404).json({ message: "Coach not found" });
    }

    return res.json(coach);
  } catch (err) {
    return next(err);
  }
}

/* ================= DELETE ================= */

export async function deleteCoach(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return invalidIdResponse(res);
    }

    const coach = await Coach.findByIdAndDelete(id).lean();

    if (!coach) {
      return res.status(404).json({ message: "Coach not found" });
    }

    return res.json({ message: "Coach deleted", id: coach._id });
  } catch (err) {
    return next(err);
  }
}
