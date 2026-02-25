import bcrypt from "bcrypt";

function readEnv(name: string) {
  const raw = process.env[name];
  if (raw === undefined) return undefined;
  const value = raw.trim();
  return value === "" ? undefined : value;
}

function parseSaltRounds() {
  const raw = readEnv("BCRYPT_SALT_ROUNDS");
  if (!raw) return 10;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 4 || value > 15) return 10;
  return value;
}

const saltRounds = parseSaltRounds();

export function isBcryptHash(passwordHash: string) {
  return /^\$2[aby]\$/.test(passwordHash);
}

export function isArgonHash(passwordHash: string) {
  return passwordHash.startsWith("$argon2");
}

export function shouldRehashPassword(passwordHash: string) {
  return isArgonHash(passwordHash);
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  if (isBcryptHash(passwordHash)) {
    return await bcrypt.compare(password, passwordHash);
  }

  if (isArgonHash(passwordHash)) {
    return await Bun.password.verify(password, passwordHash);
  }

  const bcryptOk = await (async () => {
    try {
      return await bcrypt.compare(password, passwordHash);
    } catch {
      return false;
    }
  })();

  if (bcryptOk) return true;

  try {
    return await Bun.password.verify(password, passwordHash);
  } catch {
    return false;
  }
}
