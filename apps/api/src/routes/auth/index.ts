import { Router } from "express";
import bs58 from "bs58";
import nacl from "tweetnacl";
import jwt from "jsonwebtoken";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET!;

router.post("/", async (req, res) => {
  try {
    const { wallet, signature, challengeToken } = req.body;
    if (!wallet || !signature || !challengeToken)
      return res.status(400).json({ error: "Missing fields" });

    let challenge: string;
    try {
      const decoded: any = jwt.verify(challengeToken, JWT_SECRET);
      challenge = decoded.challenge;
    } catch {
      return res.status(400).json({ error: "Invalid or expired challenge token" });
    }

    const pubkeyBytes = bs58.decode(wallet);
    const msgBytes = new TextEncoder().encode(challenge);
    const sigBytes = bs58.decode(signature);
    const valid = nacl.sign.detached.verify(msgBytes, sigBytes, pubkeyBytes);

    if (!valid) return res.status(401).json({ error: "Invalid signature" });

    const token = jwt.sign({ wallet }, JWT_SECRET, { expiresIn: "7d" });
    res.status(200).json({ token });
  } catch (err: any) {
    console.error("[/api/auth] error:", err.message || err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
