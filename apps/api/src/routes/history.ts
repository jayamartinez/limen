import { Router } from "express";
import { supabase } from "../lib/supabase";
import { verifyPrivyToken, PrivyRequest, privy } from "../lib/privy";

const router = Router();

router.post("/", verifyPrivyToken, async (req: PrivyRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Fetch the user's connected wallet address from Privy
    const user = await privy.getUser(userId);
    const walletAccount = user.linkedAccounts.find((a) => a.type === "wallet");
    const wallet = walletAccount ? walletAccount.address : user.id;

    // ---- pagination controls ----
    const coerceQueryValue = (value: unknown): string | undefined => {
      if (Array.isArray(value)) return value[0];
      if (typeof value === "string") return value;
      return undefined;
    };

    const limitParam =
      coerceQueryValue(req.query.limit) ?? coerceQueryValue(req.query.pageSize);
    const pageParam = coerceQueryValue(req.query.page);
    const allParam = coerceQueryValue(req.query.all);

    let limit: number | null = 50; // sensible default window
    if (limitParam) {
      if (limitParam.toLowerCase() === "all") {
        limit = null;
      } else {
        const parsed = parseInt(limitParam, 10);
        if (Number.isNaN(parsed) || parsed <= 0) {
          return res
            .status(400)
            .json({ error: "limit must be a positive integer or 'all'" });
        }
        limit = parsed;
      }
    }
    if (allParam && allParam.toLowerCase() === "true") {
      limit = null;
    }

    let page = 1;
    if (pageParam) {
      const parsed = parseInt(pageParam, 10);
      if (Number.isNaN(parsed) || parsed <= 0) {
        return res
          .status(400)
          .json({ error: "page must be a positive integer" });
      }
      page = parsed;
    }

    const offset = limit ? (page - 1) * limit : 0;

    let query = supabase
      .from("history")
      .select("*", { count: "exact" })
      .eq("wallet", wallet)
      .order("created_at", { ascending: false });

    if (limit) {
      const rangeEnd = offset + limit - 1;
      query = query.range(offset, rangeEnd);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    const pageSize = limit ?? (data?.length ?? 0);
    const totalRecords = count ?? data?.length ?? 0;
    const hasMore =
      limit !== null
        ? offset + (data?.length ?? 0) < totalRecords
        : false;

    res.status(200).json({
      success: true,
      history: data ?? [],
      pagination: {
        limit,
        page,
        pageSize,
        total: totalRecords,
        hasMore,
      },
    });
  } catch (err: any) {
    console.error("[/api/history] error:", err.message || err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
