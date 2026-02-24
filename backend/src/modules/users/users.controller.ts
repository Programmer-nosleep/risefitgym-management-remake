import type { Context } from "elysia";
import type { Role } from "@prisma/client";
import { UsersError, getMe, getUserById, listUsers, setUserRole, updateMe } from "./users.service";

type ElysiaSet = Context["set"];

function statusForUsersError(code: string) {
  switch (code) {
    case "USER_NOT_FOUND":
      return 404;
    case "INVALID_PASSWORD":
    case "CURRENT_PASSWORD_REQUIRED":
    case "NO_CHANGES":
      return 400;
    default:
      return 400;
  }
}

export async function meController({
  authUser,
  set,
}: {
  authUser: { id: string } | null;
  set: ElysiaSet;
}) {
  if (!authUser) {
    set.status = 401;
    return { error: "Unauthorized" };
  }

  try {
    const user = await getMe(authUser.id);
    return { user };
  } catch (error) {
    if (error instanceof UsersError) {
      set.status = statusForUsersError(error.code);
      return { error: error.message };
    }

    set.status = 500;
    return { error: "Internal Server Error" };
  }
}

export async function updateMeController({
  authUser,
  body,
  set,
}: {
  authUser: { id: string } | null;
  body: { name?: string; currentPassword?: string; newPassword?: string };
  set: ElysiaSet;
}) {
  if (!authUser) {
    set.status = 401;
    return { error: "Unauthorized" };
  }

  try {
    const user = await updateMe(authUser.id, body);
    return { user };
  } catch (error) {
    if (error instanceof UsersError) {
      set.status = statusForUsersError(error.code);
      return { error: error.message };
    }

    set.status = 500;
    return { error: "Internal Server Error" };
  }
}

export async function listUsersController() {
  return await listUsers();
}

export async function getUserController({
  params,
  set,
}: {
  params: { id: string };
  set: ElysiaSet;
}) {
  try {
    return await getUserById(params.id);
  } catch (error) {
    if (error instanceof UsersError) {
      set.status = statusForUsersError(error.code);
      return { error: error.message };
    }

    set.status = 500;
    return { error: "Internal Server Error" };
  }
}

export async function setUserRoleController({
  params,
  body,
  set,
}: {
  params: { id: string };
  body: { role: Role };
  set: ElysiaSet;
}) {
  try {
    return await setUserRole(params.id, body.role);
  } catch (error) {
    if (error instanceof UsersError) {
      set.status = statusForUsersError(error.code);
      return { error: error.message };
    }

    set.status = 500;
    return { error: "Internal Server Error" };
  }
}
