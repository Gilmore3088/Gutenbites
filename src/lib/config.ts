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
  r2: {
    accountId: () => required("R2_ACCOUNT_ID"),
    accessKeyId: () => required("R2_ACCESS_KEY_ID"),
    secretAccessKey: () => required("R2_SECRET_ACCESS_KEY"),
    bucketName: () => required("R2_BUCKET_NAME"),
  },
  elevenlabs: {
    apiKey: () => required("ELEVENLABS_API_KEY"),
    voiceId: () => required("ELEVENLABS_VOICE_ID"),
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
