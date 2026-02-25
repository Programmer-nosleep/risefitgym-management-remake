import type { Role } from "@prisma/client";
import { prisma } from "../../../prisma/schema";
import { hashPassword, verifyPassword } from "../../../utils/hash";

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
};

export type UsersErrorCode =
  | "USER_NOT_FOUND"
  | "INVALID_PASSWORD"
  | "CURRENT_PASSWORD_REQUIRED"
  | "NO_CHANGES";

export class UsersError extends Error {
  code: UsersErrorCode;

  constructor(code: UsersErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export async function getMe(userId: string): Promise<PublicUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) throw new UsersError("USER_NOT_FOUND", "User not found");
  return user;
}

export async function updateMe(
  userId: string,
  input: { name?: string; currentPassword?: string; newPassword?: string }
): Promise<PublicUser> {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const newPassword = input.newPassword;
  const currentPassword = input.currentPassword;

  const hasName = name.length > 0;
  const hasPassword = typeof newPassword === "string" && newPassword.length > 0;

  if (!hasName && !hasPassword) {
    throw new UsersError("NO_CHANGES", "No changes to update");
  }

  let nextPasswordHash: string | undefined;

  if (hasPassword) {
    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!existing) throw new UsersError("USER_NOT_FOUND", "User not found");

    if (existing.passwordHash) {
      if (!currentPassword) {
        throw new UsersError("CURRENT_PASSWORD_REQUIRED", "Current password is required");
      }

      const ok = await verifyPassword(currentPassword, existing.passwordHash);
      if (!ok) throw new UsersError("INVALID_PASSWORD", "Current password is invalid");
    }

    if (newPassword.length < 8) {
      throw new UsersError("INVALID_PASSWORD", "New password must be at least 8 characters");
    }

    nextPasswordHash = await hashPassword(newPassword);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(hasName ? { name } : {}),
      ...(nextPasswordHash ? { passwordHash: nextPasswordHash } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
}

export async function listUsers(): Promise<{ users: PublicUser[] }> {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return { users };
}

export async function getUserById(userId: string): Promise<{ user: PublicUser }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) throw new UsersError("USER_NOT_FOUND", "User not found");
  return { user };
}

export async function setUserRole(userId: string, role: Role): Promise<{ user: PublicUser }> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return { user };
}

export async function deleteUser(userId: string): Promise<{ user: PublicUser }> {
  try {
    const user = await prisma.user.delete({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return { user };
  } catch (error: any) {
    if (error.code === 'P2025') {
      throw new UsersError("USER_NOT_FOUND", "User not found");
    }
    throw error;
  }
}
