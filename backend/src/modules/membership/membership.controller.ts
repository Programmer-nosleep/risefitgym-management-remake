import type { Context } from "elysia";
import { MembershipError, getMyActiveMembership, listMemberships, subscribeMembership } from "./membership.service";

type ElysiaSet = Context["set"];

export async function listMembershipsController() {
  return await listMemberships();
}

export async function myMembershipController({
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

  return await getMyActiveMembership(authUser.id);
}

export async function subscribeMembershipController({
  authUser,
  body,
  set,
}: {
  authUser: { id: string } | null;
  body: { membershipId: string };
  set: ElysiaSet;
}) {
  if (!authUser) {
    set.status = 401;
    return { error: "Unauthorized" };
  }

  try {
    const result = await subscribeMembership(authUser.id, body.membershipId);
    set.status = 201;
    return result;
  } catch (error) {
    if (error instanceof MembershipError) {
      set.status = error.code === "MEMBERSHIP_NOT_FOUND" ? 404 : 409;
      return { error: error.message };
    }

    set.status = 500;
    return { error: "Internal Server Error" };
  }
}
