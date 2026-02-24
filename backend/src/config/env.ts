import Dotenv from "dotenv";

Dotenv.config();

export type GymConfig = {
  lat: number;
  lng: number;
  radiusMeters: number;
};

export type MidtransConfig = {
  serverKey?: string;
  clientKey?: string;
  isProduction: boolean;
};

export type AppEnv = {
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  midtrans: MidtransConfig;
  gym: GymConfig | null;
  seed: {
    adminEmail?: string;
    adminPassword?: string;
  };
};

function readEnv(name: string): string | undefined {
  const raw = process.env[name];
  if (raw === undefined) return undefined;
  const value = raw.trim();
  return value === "" ? undefined : value;
}

function requireEnv(name: string): string {
  const value = readEnv(name);
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function parseBooleanEnv(name: string, defaultValue: boolean) {
  const value = readEnv(name);
  if (!value) return defaultValue;

  if (value === "true" || value === "1" || value === "yes") return true;
  if (value === "false" || value === "0" || value === "no") return false;

  throw new Error(`Invalid boolean for ${name}: "${value}" (expected true/false)`);
}

function parseNumberEnv(
  name: string,
  defaultValue: number,
  options?: { integer?: boolean; min?: number; max?: number }
) {
  const raw = readEnv(name);
  const value = raw ? Number(raw) : defaultValue;

  if (!Number.isFinite(value)) throw new Error(`Invalid number for ${name}: "${raw}"`);
  if (options?.integer && !Number.isInteger(value)) throw new Error(`Invalid integer for ${name}: "${raw}"`);
  if (options?.min !== undefined && value < options.min) throw new Error(`Value for ${name} must be >= ${options.min}`);
  if (options?.max !== undefined && value > options.max) throw new Error(`Value for ${name} must be <= ${options.max}`);

  return value;
}

let cachedEnv: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cachedEnv) return cachedEnv;

  const port = parseNumberEnv("PORT", 8000, { integer: true, min: 1, max: 65535 });
  const databaseUrl = requireEnv("DATABASE_URL");
  const jwtSecret = requireEnv("JWT_SECRET");

  const midtrans: MidtransConfig = {
    serverKey: readEnv("MIDTRANS_SERVER_KEY"),
    clientKey: readEnv("MIDTRANS_CLIENT_KEY"),
    isProduction: parseBooleanEnv("MIDTRANS_IS_PRODUCTION", false),
  };

  const gymLatRaw = readEnv("GYM_LAT");
  const gymLngRaw = readEnv("GYM_LNG");
  const gymRadiusRaw = readEnv("GYM_RADIUS_METERS");

  let gym: GymConfig | null = null;
  if (gymLatRaw || gymLngRaw) {
    if (!gymLatRaw || !gymLngRaw) throw new Error("GYM_LAT and GYM_LNG must be set together");

    const lat = Number(gymLatRaw);
    const lng = Number(gymLngRaw);
    const radiusMeters = gymRadiusRaw ? Number(gymRadiusRaw) : 200;

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new Error(`Invalid gym coordinates (GYM_LAT/GYM_LNG): "${gymLatRaw}", "${gymLngRaw}"`);
    }

    if (!Number.isFinite(radiusMeters) || radiusMeters <= 0) {
      throw new Error(`Invalid GYM_RADIUS_METERS: "${gymRadiusRaw}"`);
    }

    gym = { lat, lng, radiusMeters };
  }

  const seed = {
    adminEmail: readEnv("SEED_ADMIN_EMAIL"),
    adminPassword: readEnv("SEED_ADMIN_PASSWORD"),
  };

  cachedEnv = { port, databaseUrl, jwtSecret, midtrans, gym, seed };
  return cachedEnv;
}

export const env = getEnv();
