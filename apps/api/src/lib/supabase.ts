// lib/supabase.ts
import { config } from "dotenv";

import { createClient } from "@supabase/supabase-js"

config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // not exposed to client

export const supabase = createClient(supabaseUrl, serviceRoleKey)
