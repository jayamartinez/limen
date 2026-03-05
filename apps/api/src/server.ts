import express from "express";
import { config } from "dotenv";
import analyzeRouter from "./routes/analyze/signal";
import authRouter from "./routes/auth";
import challengeRouter from "./routes/auth/challenge";
import historyRouter from "./routes/history";

config();

const app = express();
app.use(express.json());

// ---- Request Logging ----
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const method = req.method.padEnd(6, " ");
    console.log(
      `[${new Date().toISOString()}] ${method} ${req.originalUrl} → ${res.statusCode} ${res.statusMessage} (${duration}ms)`
    );
  });
  next();
});

// ---- CORS (force headers; works on Vercel & locally) ----
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  const isAllowed = origin && allowedOrigins.includes(origin);

  if (isAllowed) {
    res.setHeader("Access-Control-Allow-Origin", origin!);
  }
  // Allow credentials if you ever need cookies (not required for this flow)
  // res.setHeader("Access-Control-Allow-Credentials", "true");

  // Reflect requested headers if present, otherwise supply a whitelist including x402 headers
  const requested = req.header("access-control-request-headers");
  res.setHeader(
    "Access-Control-Allow-Headers",
    requested || "Content-Type, Authorization, X-Requested-With, X-402-Payment, X-402-Request, X-402-Signature, X-402-Asset, X-402-Price, X-402-Provider"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS,PUT,DELETE");
  res.setHeader("Access-Control-Max-Age", "86400");

  // ⭐ Expose x402 headers so the browser/x402 client can read them
  // Using * is broadly supported, but we also enumerate the known headers for safety.
  res.setHeader(
    "Access-Control-Expose-Headers",
    "*, X-402-Required, X-402-Payment, X-402-Request, X-402-Signature, X-402-Asset, X-402-Price, X-402-Provider"
  );

  console.log(
    `[CORS] ${req.method} ${req.originalUrl} from ${origin || "no-origin"} ${
      isAllowed ? "✅ allowed" : "❌ blocked"
    }`
  );

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  next();
});

// ---- ROUTES ----
app.use("/api/analyze", analyzeRouter);
app.use("/api/auth", authRouter);
app.use("/api/auth/challenge", challengeRouter);
app.use("/api/history", historyRouter);

// ---- Health check ----
app.get("/", (_, res) => res.json({ ok: true, msg: "Limen API running" }));

// ---- Start server ----
const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`✅ Limen API running on port ${port}`));
