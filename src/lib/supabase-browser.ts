import { createClient } from "@supabase/supabase-js";
import { publicConfig } from "./config";

export function getSupabaseBrowser() {
  return createClient(
    publicConfig.supabase.url,
    publicConfig.supabase.anonKey
  );
}
