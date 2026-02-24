import { Elysia } from "elysia";
import type { Role } from "@prisma/client";
import { prisma } from "../../prisma/schema";
import { verifyAccessToken } from "../../utils/jwt";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

function parseBearerToken(authorization?: string | null) {
  if (!authorization) return null;
  const [scheme, token] = authorization.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
}

export const authMiddleware = new Elysia().derive(
  { as: "global" },
  async ({ headers }): Promise<{ authUser: AuthUser | null }> => {
    const token = parseBearerToken(headers.authorization);
    if (!token) return { authUser: null };

    try {
      const { userId } = await verifyAccessToken(token);
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true },
      });

      if (!user) return { authUser: null };
      return { authUser: user satisfies AuthUser };
    } catch (error) {
      console.error(`Error verifying access token: ${error}`);
      return { authUser: null };
    }
  }
);
