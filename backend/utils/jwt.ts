import { jwtVerify, SignJWT } from "jose";
import type { Role } from "@prisma/client";

const textEncoder = new TextEncoder();

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is required");
  return textEncoder.encode(secret);
}

export type AccessTokenPayload = {
  userId: string;
  role: Role;
};

export type AttendanceTokenPayload = {
  userId: string;
};

export async function signAccessToken(payload: AccessTokenPayload) {
  return await new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, getJwtSecret(), {
    algorithms: ["HS256"],
  });

  const userId = payload.sub;
  const role = payload.role;

  if (typeof userId !== "string") throw new Error("Invalid token subject");
  if (typeof role !== "string") throw new Error("Invalid token role");

  return { userId, role: role as Role };
}

export async function signAttendanceToken(payload: AttendanceTokenPayload, expiresAt?: Date) {
  const jwt = new SignJWT({ scope: "attendance" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuedAt();

  if (expiresAt) jwt.setExpirationTime(expiresAt);
  else jwt.setExpirationTime("5m");

  return await jwt.sign(getJwtSecret());
}

export async function verifyAttendanceToken(token: string): Promise<AttendanceTokenPayload> {
  const { payload } = await jwtVerify(token, getJwtSecret(), {
    algorithms: ["HS256"],
  });

  const userId = payload.sub;
  const scope = payload.scope;

  if (scope !== "attendance") throw new Error("Invalid attendance token");
  if (typeof userId !== "string") throw new Error("Invalid token subject");

  return { userId };
}
