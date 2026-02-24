import { Elysia } from "elysia";
import type { Role } from "@prisma/client";
import type { SingletonBase } from "elysia";
import type { AuthUser } from "./auth.middleware";

type AuthSingleton = SingletonBase & {
  derive: {
    authUser: AuthUser | null;
  };
};

export function requireRoles(allowedRoles: Role[]) {
  return new Elysia<"", AuthSingleton>().onBeforeHandle(({ authUser, set }) => {
    if (!authUser) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    if (!allowedRoles.includes(authUser.role)) {
      set.status = 403;
      return { error: "Forbidden" };
    }
  });
}
