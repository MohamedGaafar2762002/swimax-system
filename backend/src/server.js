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

/**
 * ✅ FIX: use Railway dynamic port correctly
 */
const PORT = process.env.PORT || 5000;

/**
 * ✅ Allowed origins
 */
const allowedOrigins = [
  "http://localhost:5173",
  "https://swimax-system.vercel.app",
];

/**
 * ✅ CORS config (supports Vercel previews)
 */
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    try {
      const hostname = new URL(origin).hostname;

      if (
        allowedOrigins.includes(origin) ||
        hostname.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }
    } catch (err) {
      return callback(null, false);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

/**
 * ✅ APPLY CORS BEFORE ROUTES
 */
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

/**
 * ✅ Middlewares
 */
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use("/uploads", express.static("uploads"));

/**
 * ✅ Public routes
 */
app.use("/api/auth", authRoutes);

/**
 * ✅ Health check (for Railway)
 */
app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "swimming-academy-api" });
});

/**
 * 🔒 Protected routes
 */
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

/**
 * ❌ 404 handler
 */
app.use((_req, res) => {
  res.status(404).json({ message: "Not found" });
});

/**
 * ❌ Error handler
 */
app.use((err, _req, res, _next) => {
  const status = err.statusCode || err.status || 500;
  const message = err.message || "Internal server error";

  console.error("❌ Error:", err);

  res.status(status).json({ message });
});

/**
 * 🚀 Start server
 */
async function start() {
  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is required.");
    process.exit(1);
  }

  await connectDB();
  // await seedDefaultManager();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ API running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});