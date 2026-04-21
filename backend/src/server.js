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
 * ✅ IMPORTANT: Railway port
 */
const PORT = process.env.PORT;

/**
 * ✅ Allowed origins
 */
const allowedOrigins = [
  "http://localhost:5173",
  "https://swimax-system.vercel.app",
];

/**
 * ✅ CORS config (supports Vercel preview links)
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
      console.error("CORS parse error:", err);
      return callback(null, false);
    }

    console.warn("Blocked by CORS:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

/**
 * ✅ Apply middlewares
 */
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());
app.use(morgan("dev"));
app.use("/uploads", express.static("uploads"));

/**
 * ✅ Health check (IMPORTANT for Railway)
 */
app.get("/", (_req, res) => {
  res.send("API is running 🚀");
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "swimming-academy-api" });
});

/**
 * ✅ Public routes
 */
app.use("/api/auth", authRoutes);

/**
 * 🔒 Protected routes
 */
const protectedApi = express.Router();
protectedApi.use(authMiddleware);

protectedApi.get("/health", (req, res) => {
  res.json({
    ok: true,
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
  console.error("💥 ERROR:", err);

  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

/**
 * 🚀 Start server with FULL DEBUG
 */
async function start() {
  try {
    console.log("🚀 Starting server...");

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing");
    }

    console.log("🔐 JWT OK");

    await connectDB();
    console.log("✅ MongoDB Connected");

    // await seedDefaultManager();

    if (!PORT) {
      throw new Error("PORT is missing from environment");
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🔥 Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error("💥 START ERROR:", err);
    process.exit(1);
  }
}

start();