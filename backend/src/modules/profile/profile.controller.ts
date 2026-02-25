import type { Context } from "elysia";
import { ProfileError, getProfileDashboard } from "./profile.service";
import { UsersError, updateMe } from "../users/users.service";

type ElysiaSet = Context["set"];

function statusForProfileError(code: string) {
  switch (code) {
    case "USER_NOT_FOUND":
      return 404;
    default:
      return 400;
  }
}

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

export async function myProfileController({
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
    const profile = await getProfileDashboard(authUser.id);
    return { profile };
  } catch (error) {
    if (error instanceof ProfileError) {
      set.status = statusForProfileError(error.code);
      return { error: error.message };
    }

    set.status = 500;
    return { error: "Internal Server Error" };
  }
}

export async function getUserProfileController({
  params,
  set,
}: {
  params: { id: string };
  set: ElysiaSet;
}) {
  try {
    const profile = await getProfileDashboard(params.id);
    return { profile };
  } catch (error) {
    if (error instanceof ProfileError) {
      set.status = statusForProfileError(error.code);
      return { error: error.message };
    }

    set.status = 500;
    return { error: "Internal Server Error" };
  }
}

export async function updateMyProfileController({
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
