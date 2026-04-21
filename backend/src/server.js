import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { connectDB } from "./config/db.js";
import { seedDefaultManager } from "./utils/seedManager.js";
import authRoutes from "./routes/authRoutes.js";
import { authMiddleware } from "./middleware/authMiddleware.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import coachRoutes from "./routes/coachRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";
import traineeRoutes from "./routes/traineeRoutes.js";

const app = express();
const PORT = Number(process.env.PORT) || 5000;

const allowedOrigins = [
  "http://localhost:5173",
  "https://swimax-system.vercel.app",
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (
      allowedOrigins.includes(origin) ||
      origin.includes("vercel.app")
    ) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

app.options("*", cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use("/uploads", express.static("uploads"));

app.use("/api/auth", authRoutes);
app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "swimming-academy-api" });
});

const protectedApi = express.Router();
protectedApi.use(authMiddleware);

protectedApi.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "swimming-academy-api",
    user: req.user?.username ?? null,
  });
});

protectedApi.use("/coaches", coachRoutes);
protectedApi.use("/sessions", sessionRoutes);
protectedApi.use("/trainees", traineeRoutes);
protectedApi.use("/attendance", attendanceRoutes);

app.use("/api", protectedApi);

app.use((_req, res) => {
  res.status(404).json({ message: "Not found" });
});

app.use((err, _req, res, _next) => {
  const status = err.statusCode || err.status || 500;
  const message = err.message || "Internal server error";
  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }
  res.status(status).json({ message });
});

async function start() {
  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is required. Add it to your .env file.");
    process.exit(1);
  }
  await connectDB();
  await seedDefaultManager();
  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
