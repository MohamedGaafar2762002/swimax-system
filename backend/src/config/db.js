import mongoose from "mongoose";

/**
 * Redacts credentials from a MongoDB URI so it is safe to log.
 * mongodb://user:pass@host:port/db  →  mongodb://***:***@host:port/db
 */
function redactUri(uri) {
  try {
    const parsed = new URL(uri);
    if (parsed.username) parsed.username = "***";
    if (parsed.password) parsed.password = "***";
    return parsed.toString();
  } catch {
    // If URL parsing fails the string is likely malformed — flag it clearly.
    return "<unparseable URI>";
  }
}

/**
 * Build a credential-free URI (no username / password) from the original URI
 * so we can test whether the host/port is reachable independently of auth.
 */
function unauthenticatedUri(uri) {
  try {
    const parsed = new URL(uri);
    parsed.username = "";
    parsed.password = "";
    return parsed.toString();
  } catch {
    return null;
  }
}

export async function connectDB() {
  const uri = String(process.env.MONGODB_URI ?? "").trim();

  // ── 1. Validate the variable is present ──────────────────────────────────
  if (!uri) {
    console.error("❌ MONGODB_URI is not set or is empty.");
    process.exit(1);
  }

  // ── 2. Log the redacted URI so we can confirm the value is resolved ───────
  console.log(`🔍 MONGODB_URI (redacted): ${redactUri(uri)}`);

  mongoose.set("strictQuery", true);

  // ── 3. Probe host reachability without credentials ────────────────────────
  const noAuthUri = unauthenticatedUri(uri);
  if (noAuthUri && noAuthUri !== uri) {
    console.log("🔍 Testing host reachability without credentials…");
    try {
      const probe = await mongoose.createConnection(noAuthUri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      }).asPromise();
      console.log(
        `✅ Host is reachable without credentials (${probe.host}). Issue is likely auth-related.`,
      );
      await probe.close();
    } catch (probeErr) {
      // "bad auth" errors mean the host IS reachable — credentials are the problem.
      if (/bad auth|authentication failed/i.test(probeErr.message)) {
        console.warn(
          "⚠️  Host reachable but authentication failed even without credentials — " +
            "this confirms the issue is credential/auth related.",
        );
      } else {
        console.warn(
          `⚠️  Host unreachable without credentials: ${probeErr.message}`,
        );
        console.warn(
          "    → Check that the Railway MongoDB service is running and the hostname/port in MONGODB_URI are correct.",
        );
      }
    }
  }

  // ── 4. Attempt the real authenticated connection ──────────────────────────
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn.connection;
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);

    // Provide targeted guidance based on the error type.
    if (/bad auth|authentication failed/i.test(err.message)) {
      console.error(
        "   → Authentication failed. Verify MONGODB_URI contains the correct username and password.",
      );
      console.error(
        "   → In Railway: open the MongoDB service → Variables and confirm MONGO_INITDB_ROOT_USERNAME / MONGO_INITDB_ROOT_PASSWORD match the credentials in MONGODB_URI.",
      );
    } else if (/ECONNREFUSED|ENOTFOUND|timed out/i.test(err.message)) {
      console.error(
        "   → Could not reach the MongoDB host. Verify the hostname and port in MONGODB_URI.",
      );
      console.error(
        "   → Ensure the swimax-system service and the MongoDB service are in the same Railway project/network.",
      );
    } else {
      console.error(
        "   → Check Railway env var MONGODB_URI and confirm the MongoDB service is healthy.",
      );
    }

    process.exit(1);
  }
}