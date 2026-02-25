import type { Role } from "@prisma/client";
import { prisma } from "../../../prisma/schema";
import { hashPassword, shouldRehashPassword, verifyPassword } from "../../../utils/hash";
import { signAccessToken } from "../../../utils/jwt";

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type AuthSuccess = {
  user: PublicUser;
  accessToken: string;
};

export type AuthErrorCode = "EMAIL_EXISTS" | "INVALID_CREDENTIALS";

export class AuthError extends Error {
  code: AuthErrorCode;

  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
  role?: Role;
}): Promise<AuthSuccess> {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (existing) {
    throw new AuthError("EMAIL_EXISTS", "Email already in use");
  }

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      role: input.role || "USER",
      cart: { create: {} },
    },
    select: { id: true, name: true, email: true, role: true },
  });

  const accessToken = await signAccessToken({ userId: user.id, role: user.role });
  return { user, accessToken };
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<AuthSuccess> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, name: true, email: true, role: true, passwordHash: true },
  });

  if (!user || !user.passwordHash) {
    throw new AuthError("INVALID_CREDENTIALS", "Invalid email or password");
  }

  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) {
    throw new AuthError("INVALID_CREDENTIALS", "Invalid email or password");
  }

  if (shouldRehashPassword(user.passwordHash)) {
    try {
      const nextHash = await hashPassword(input.password);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: nextHash },
        select: { id: true },
      });
    } catch (error) {
      console.warn(`Failed to rehash password for user ${user.id}:`, error);
    }
  }

  const accessToken = await signAccessToken({ userId: user.id, role: user.role });

  const { passwordHash: _passwordHash, ...publicUser } = user;
  return { user: publicUser, accessToken };
}
