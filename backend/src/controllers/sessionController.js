import mongoose from "mongoose";
import Coach from "../models/Coach.js";
import Session, { SESSION_DAYS } from "../models/Session.js";
import Trainee from "../models/Trainee.js";
import { escapeRegex } from "../utils/escapeRegex.js";

const ALLOWED_SORT_FIELDS = ["createdAt"];
const MAX_PAGE_SIZE = 100;
const POPULATE_OPTIONS = [
  { path: "coachId", select: "name" },
  { path: "trainees", select: "name level" },
];

const INDEX_DAY = SESSION_DAYS;

function invalidIdResponse(res) {
  return res.status(400).json({ message: "Invalid session id" });
}

function parseTimeToMinutes(value) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(value ?? "").trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function dayFromNow(now = new Date()) {
  return INDEX_DAY[now.getDay()];
}

function normalizeObjectIdArray(raw) {
  if (raw === undefined || raw === null) {
    return { ids: [] };
  }
  if (!Array.isArray(raw)) {
    return { error: "trainees must be an array" };
  }
  const out = [];
  const seen = new Set();
  for (const item of raw) {
    const s = String(item ?? "").trim();
    if (!s) continue;
    if (!mongoose.Types.ObjectId.isValid(s)) {
      return { error: "Invalid trainee id in list" };
    }
    if (seen.has(s)) {
      return { error: "Duplicate trainee ids are not allowed" };
    }
    seen.add(s);
    out.push(new mongoose.Types.ObjectId(s));
  }
  return { ids: out };
}

function validateScheduleSlots(schedule) {
  if (!Array.isArray(schedule)) {
    return { error: "schedule must be an array" };
  }
  if (schedule.length === 0) {
    return { error: "At least one schedule slot is required" };
  }

  const normalized = [];
  for (const slot of schedule) {
    if (!slot || typeof slot !== "object") {
      return { error: "Each schedule slot must be an object" };
    }
    const day = String(slot.day ?? "").trim();
    if (!SESSION_DAYS.includes(day)) {
      return { error: `Invalid day "${day}". Must be one of: ${SESSION_DAYS.join(", ")}` };
    }
    const startTime = String(slot.startTime ?? "").trim();
    const endTime = String(slot.endTime ?? "").trim();
    const startM = parseTimeToMinutes(startTime);
    const endM = parseTimeToMinutes(endTime);
    if (startM === null || endM === null) {
      return { error: "startTime and endTime must be in HH:mm format (00:00–23:59)" };
    }
    if (endM <= startM) {
      return { error: "Each slot endTime must be later than startTime" };
    }
    normalized.push({ day, startTime, endTime });
  }

  return { slots: normalized };
}

async function validateCoachExists(coachId) {
  const coach = await Coach.findById(coachId).select("_id").lean();
  if (!coach) {
    return { error: "Coach not found" };
  }
  return { ok: true };
}

async function validateTraineesExist(traineeObjectIds) {
  if (traineeObjectIds.length === 0) return { ok: true };
  const count = await Trainee.countDocuments({ _id: { $in: traineeObjectIds } });
  if (count !== traineeObjectIds.length) {
    return { error: "One or more trainees do not exist" };
  }
  return { ok: true };
}

async function parseAndValidateSessionBody(body) {
  const { coachId, trainees, schedule } = body ?? {};

  if (coachId === undefined || coachId === null || String(coachId).trim() === "") {
    return { error: "coachId is required" };
  }
  const coachIdStr = String(coachId).trim();
  if (!mongoose.Types.ObjectId.isValid(coachIdStr)) {
    return { error: "Invalid coach id" };
  }

  const idParse = normalizeObjectIdArray(trainees);
  if (idParse.error) return { error: idParse.error };
  const traineeObjectIds = idParse.ids;

  const sched = validateScheduleSlots(schedule);
  if (sched.error) return { error: sched.error };

  const coachCheck = await validateCoachExists(coachIdStr);
  if (coachCheck.error) return { error: coachCheck.error };

  const traineeCheck = await validateTraineesExist(traineeObjectIds);
  if (traineeCheck.error) return { error: traineeCheck.error };

  return {
    data: {
      coachId: new mongoose.Types.ObjectId(coachIdStr),
      trainees: traineeObjectIds,
      schedule: sched.slots,
    },
  };
}

/**
 * Keep Trainee.sessionId in sync with this session's trainees[]:
 * - trainees removed from this session → sessionId cleared (if it pointed here)
 * - trainees added → sessionId set here; removed from any other session's trainees[]
 */
async function syncTraineesToSession(sessionId, traineeObjectIds) {
  const sid =
    sessionId instanceof mongoose.Types.ObjectId
      ? sessionId
      : new mongoose.Types.ObjectId(String(sessionId));

  await Trainee.updateMany(
    { sessionId: sid, _id: { $nin: traineeObjectIds } },
    { $set: { sessionId: null } },
  );

  for (const tid of traineeObjectIds) {
    const trainee = await Trainee.findById(tid).select("sessionId").lean();
    if (!trainee) continue;

    const oldSid = trainee.sessionId;
    if (oldSid && String(oldSid) !== String(sid)) {
      await Session.updateOne({ _id: oldSid }, { $pull: { trainees: tid } });
    }

    if (!oldSid || String(oldSid) !== String(sid)) {
      await Trainee.updateOne({ _id: tid }, { $set: { sessionId: sid } });
    }
  }
}

function findAllCurrentSessions(sessions, now = new Date()) {
  const day = dayFromNow(now);
  const minutes = now.getHours() * 60 + now.getMinutes();

  const results = [];

  for (const session of sessions) {
    const slots = Array.isArray(session.schedule) ? session.schedule : [];

    for (const slot of slots) {
      if (slot.day !== day) continue;

      const start = parseTimeToMinutes(slot.startTime);
      const end = parseTimeToMinutes(slot.endTime);
      if (start === null || end === null) continue;
      if (end <= start) continue;

      if (minutes >= start && minutes < end) {
        results.push({
          ...session,
          currentSlot: slot,
        });
      }
    }
  }

  return results;
}

function formatLocalDateOnly(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Next time this slot starts after `now` (local calendar).
 */
function computeNextSlotStart(slot, now = new Date()) {
  const startM = parseTimeToMinutes(slot.startTime);
  const endM = parseTimeToMinutes(slot.endTime);
  if (startM === null || endM === null || endM <= startM) return null;

  const targetDow = SESSION_DAYS.indexOf(slot.day);
  if (targetDow === -1) return null;

  const nowMs = now.getTime();

  for (let addDays = 0; addDays < 14; addDays++) {
    const cal = new Date(now.getFullYear(), now.getMonth(), now.getDate() + addDays);
    if (cal.getDay() !== targetDow) continue;

    const [sh, sm] = String(slot.startTime)
      .trim()
      .split(":")
      .map(Number);
    const candidate = new Date(cal);
    candidate.setHours(sh, sm, 0, 0);

    if (candidate.getTime() > nowMs) {
      return {
        instant: candidate.getTime(),
        dateStr: formatLocalDateOnly(cal),
        slot,
      };
    }
  }

  return null;
}

function findNextUpcomingSession(sessions, now = new Date()) {
  let best = null;

  for (const session of sessions) {
    const slots = Array.isArray(session.schedule) ? session.schedule : [];
    for (const slot of slots) {
      const next = computeNextSlotStart(slot, now);
      if (!next) continue;
      if (!best || next.instant < best.instant) {
        best = { ...next, session };
      }
    }
  }

  if (!best) return null;

  return {
    ...best.session,
    upcomingSlot: {
      day: best.slot.day,
      startTime: best.slot.startTime,
      endTime: best.slot.endTime,
      date: best.dateStr,
    },
  };
}

async function buildSearchFilter(search) {
  const q = String(search ?? "").trim();
  if (!q) return {};

  const coachIds = await Coach.find({
    name: { $regex: escapeRegex(q), $options: "i" },
  })
    .select("_id")
    .lean()
    .then((rows) => rows.map((c) => c._id));

  const qLower = q.toLowerCase();
  const matchedDays = SESSION_DAYS.filter((d) => d.toLowerCase().includes(qLower));

  const or = [];
  if (coachIds.length) or.push({ coachId: { $in: coachIds } });
  if (matchedDays.length) or.push({ "schedule.day": { $in: matchedDays } });

  if (!or.length) {
    return { _id: { $in: [] } };
  }
  return { $or: or };
}

/* ================= CRUD ================= */

export async function createSession(req, res, next) {
  try {
    const parsed = await parseAndValidateSessionBody(req.body);
    if (parsed.error) {
      return res.status(400).json({ message: parsed.error });
    }

    const session = await Session.create(parsed.data);
    await syncTraineesToSession(session._id, parsed.data.trainees);

    const populated = await Session.findById(session._id).populate(POPULATE_OPTIONS).lean();
    return res.status(201).json(populated);
  } catch (err) {
    return next(err);
  }
}

export async function getAllSessions(req, res, next) {
  try {
    const { search, sortBy, order } = req.query;

    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
    const limit = Math.min(MAX_PAGE_SIZE, parseInt(String(req.query.limit || "10"), 10) || 10);

    const searchFilter = await buildSearchFilter(search);

    const sortField = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : "createdAt";
    const sortOrder = order === "asc" ? 1 : -1;

    const filter = { ...searchFilter };

    const totalItems = await Session.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));

    const sessions = await Session.find(filter)
      .sort({ [sortField]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(POPULATE_OPTIONS)
      .lean();

    return res.json({
      sessions,
      currentPage: page,
      totalPages,
      totalItems,
    });
  } catch (err) {
    return next(err);
  }
}

export async function getSessionById(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return invalidIdResponse(res);
    }

    const session = await Session.findById(id).populate(POPULATE_OPTIONS).lean();

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    return res.json(session);
  } catch (err) {
    return next(err);
  }
}

export async function updateSession(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return invalidIdResponse(res);
    }

    const existing = await Session.findById(id);
    if (!existing) {
      return res.status(404).json({ message: "Session not found" });
    }

    const parsed = await parseAndValidateSessionBody(req.body);
    if (parsed.error) {
      return res.status(400).json({ message: parsed.error });
    }

    const session = await Session.findByIdAndUpdate(id, parsed.data, {
      new: true,
      runValidators: true,
    })
      .populate(POPULATE_OPTIONS)
      .lean();

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    await syncTraineesToSession(id, parsed.data.trainees);

    const refreshed = await Session.findById(id).populate(POPULATE_OPTIONS).lean();
    return res.json(refreshed);
  } catch (err) {
    return next(err);
  }
}

export async function deleteSession(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return invalidIdResponse(res);
    }

    const existing = await Session.findById(id).select("_id").lean();
    if (!existing) {
      return res.status(404).json({ message: "Session not found" });
    }

    await Trainee.updateMany({ sessionId: id }, { $set: { sessionId: null } });
    await Session.findByIdAndDelete(id);

    return res.json({ message: "deleted" });
  } catch (err) {
    return next(err);
  }
}

export async function clearAllSessions(req, res, next) {
  try {
    await Session.deleteMany({});
    await Trainee.updateMany({}, { $set: { sessionId: null } });
    return res.json({ message: "All sessions cleared" });
  } catch (err) {
    return next(err);
  }
}

export async function getCurrentSession(req, res, next) {
  try {
    const sessions = await Session.find().populate(POPULATE_OPTIONS).lean();

    const results = findAllCurrentSessions(sessions);

    return res.json({
      current: results,
    });
  } catch (err) {
    return next(err);
  }
}

export async function getUpcomingSession(req, res, next) {
  try {
    const sessions = await Session.find().populate(POPULATE_OPTIONS).lean();

    const upcoming = findNextUpcomingSession(sessions);

    return res.json({
      upcoming,
    });
  } catch (err) {
    return next(err);
  }
}
