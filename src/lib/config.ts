function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string): string | undefined {
  return process.env[name] || undefined;
}

export function isSupabaseConfigured(): boolean {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export const config = {
  supabase: {
    url: () => required("SUPABASE_URL"),
    serviceRoleKey: () => required("SUPABASE_SERVICE_ROLE_KEY"),
  },
  storage: {
    bucket: () => process.env.STORAGE_BUCKET ?? "gutenbites",
  },
  elevenlabs: {
    apiKey: () => process.env.ELEVENLABS_API_KEY ?? "",
    voiceId: () => process.env.ELEVENLABS_VOICE_ID ?? "",
  },
  anthropic: {
    apiKey: () => required("ANTHROPIC_API_KEY"),
  },
} as const;

export const publicConfig = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  },
} as const;
