import { Router } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET!;
const CHALLENGE_TTL_SECONDS = 120;

router.get("/", async (_req, res) => {
  try {
    const challenge = crypto.randomUUID();
    const challengeToken = jwt.sign({ challenge }, JWT_SECRET, {
      expiresIn: `${CHALLENGE_TTL_SECONDS}s`,
    });
    res.status(200).json({ challenge, challengeToken });
  } catch (err: any) {
    console.error("[/api/auth/challenge] error:", err.message || err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
