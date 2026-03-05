import { Request, Response, NextFunction } from "express";
import { PrivyClient, AuthTokenClaims } from "@privy-io/server-auth";

export const privy = new PrivyClient(
    process.env.PRIVY_APP_ID!,
    process.env.PRIVY_APP_SECRET!
);

export interface PrivyRequest extends Request {
    user?: AuthTokenClaims;
}

/**
 * Middleware to verify a Privy access token in the Authorization header.
 * Adds `req.user` with the verified Privy user ID if successful.
 */
export async function verifyPrivyToken(req: PrivyRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing or invalid authorization token" });
    }

    const token = authHeader.replace("Bearer ", "");

    try {
        const verifiedClaims = await privy.verifyAuthToken(token);
        req.user = verifiedClaims;
        next();
    } catch (error) {
        console.error("[Privy Auth Error]", error);
        return res.status(401).json({ error: "Invalid token" });
    }
}
