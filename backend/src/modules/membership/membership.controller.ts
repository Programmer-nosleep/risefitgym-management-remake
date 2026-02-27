import type { Context } from "elysia";
import { Prisma } from "@prisma/client";
import {
  MembershipError,
  createMembership,
  deleteMembership,
  getMyActiveMembership,
  listMemberships,
  subscribeMembership,
  updateMembership,
} from "./membership.service";

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

export async function createMembershipController({
  authUser,
  body,
  set,
}: {
  authUser: { id: string } | null;
  body: { name: string; description: string; price: number; durationDays: number };
  set: ElysiaSet;
}) {
  if (!authUser) {
    set.status = 401;
    return { error: "Unauthorized" };
  }

  try {
    const result = await createMembership(body);
    set.status = 201;
    return result;
  } catch {
    set.status = 500;
    return { error: "Internal Server Error" };
  }
}

export async function updateMembershipController({
  authUser,
  params,
  body,
  set,
}: {
  authUser: { id: string } | null;
  params: { id: string };
  body: { name?: string; description?: string; price?: number; durationDays?: number };
  set: ElysiaSet;
}) {
  if (!authUser) {
    set.status = 401;
    return { error: "Unauthorized" };
  }

  try {
    return await updateMembership(params.id, body);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      set.status = 404;
      return { error: "Membership not found" };
    }

    set.status = 500;
    return { error: "Internal Server Error" };
  }
}

export async function deleteMembershipController({
  authUser,
  params,
  set,
}: {
  authUser: { id: string } | null;
  params: { id: string };
  set: ElysiaSet;
}) {
  if (!authUser) {
    set.status = 401;
    return { error: "Unauthorized" };
  }

  try {
    return await deleteMembership(params.id);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        set.status = 404;
        return { error: "Membership not found" };
      }

      if (error.code === "P2003") {
        set.status = 409;
        return { error: "Membership is in use and cannot be deleted" };
      }
    }

    set.status = 500;
    return { error: "Internal Server Error" };
  }
}
