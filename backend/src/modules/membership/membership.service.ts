import { prisma } from "../../../prisma/schema";

export type MembershipErrorCode = "MEMBERSHIP_NOT_FOUND" | "ALREADY_ACTIVE";

export class MembershipError extends Error {
  code: MembershipErrorCode;

  constructor(code: MembershipErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export async function listMemberships() {
  const memberships = await prisma.membership.findMany({
    orderBy: { price: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      durationDays: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return { memberships };
}

export async function createMembership(input: {
  name: string;
  description: string;
  price: number;
  durationDays: number;
}) {
  const membership = await prisma.membership.create({
    data: {
      name: input.name,
      description: input.description,
      price: input.price,
      durationDays: input.durationDays,
    },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      durationDays: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return { membership };
}

export async function updateMembership(
  membershipId: string,
  input: {
    name?: string;
    description?: string;
    price?: number;
    durationDays?: number;
  }
) {
  const membership = await prisma.membership.update({
    where: { id: membershipId },
    data: {
      name: input.name,
      description: input.description,
      price: input.price,
      durationDays: input.durationDays,
    },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      durationDays: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return { membership };
}

export async function deleteMembership(membershipId: string) {
  const membership = await prisma.membership.delete({
    where: { id: membershipId },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      durationDays: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return { membership };
}

export async function getMyActiveMembership(userId: string) {
  const now = new Date();

  await prisma.userMembership.updateMany({
    where: { userId, status: "ACTIVE", endDate: { lt: now } },
    data: { status: "EXPIRED" },
  });

  const membership = await prisma.userMembership.findFirst({
    where: { userId, status: "ACTIVE", endDate: { gte: now } },
    orderBy: { endDate: "desc" },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      status: true,
      membership: {
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          durationDays: true,
        },
      },
    },
  });

  return { activeMembership: membership };
}

export async function subscribeMembership(userId: string, membershipId: string) {
  const now = new Date();

  return await prisma.$transaction(async (tx) => {
    const existingActive = await tx.userMembership.findFirst({
      where: { userId, status: "ACTIVE", endDate: { gte: now } },
      select: { id: true },
    });
    if (existingActive) throw new MembershipError("ALREADY_ACTIVE", "You already have an active membership");

    const membership = await tx.membership.findUnique({
      where: { id: membershipId },
      select: { id: true, durationDays: true },
    });
    if (!membership) throw new MembershipError("MEMBERSHIP_NOT_FOUND", "Membership not found");

    const startDate = now;
    const endDate = new Date(startDate.getTime() + membership.durationDays * 24 * 60 * 60 * 1000);

    const userMembership = await tx.userMembership.create({
      data: {
        userId,
        membershipId,
        startDate,
        endDate,
        status: "ACTIVE",
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        status: true,
        membership: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            durationDays: true,
          },
        },
      },
    });

    return { userMembership };
  });
}
