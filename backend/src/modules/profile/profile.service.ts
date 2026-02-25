import type { OrderStatus, Role } from "@prisma/client";
import { prisma } from "../../../prisma/schema";
import { getMyActiveMembership } from "../membership/membership.service";

export type ProfileErrorCode = "USER_NOT_FOUND";

export class ProfileError extends Error {
  code: ProfileErrorCode;

  constructor(code: ProfileErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

function isPaidOrderStatus(status: OrderStatus) {
  return status === "PAID" || status === "COMPLETED";
}

export type ProfileUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
};

export type ProfileStats = {
  ordersCount: number;
  paidOrdersCount: number;
  totalSpent: number;
  attendancesCount: number;
};

export type ProfileDashboard = {
  user: ProfileUser;
  activeMembership: Awaited<ReturnType<typeof getMyActiveMembership>>["activeMembership"];
  lastAttendanceAt: Date | null;
  stats: ProfileStats;
  recentOrders: { id: string; status: OrderStatus; total: number; createdAt: Date }[];
  recentAttendances: { id: string; checkInAt: Date; checkOutAt: Date | null; createdAt: Date }[];
};

export async function getProfileDashboard(userId: string): Promise<ProfileDashboard> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
  });

  if (!user) throw new ProfileError("USER_NOT_FOUND", "User not found");

  const [{ activeMembership }, ordersCount, paidOrdersCount, paidTotalAgg, attendancesCount, lastAttendance, recentOrders, recentAttendances] =
    await Promise.all([
      getMyActiveMembership(userId),
      prisma.order.count({ where: { userId } }),
      prisma.order.count({ where: { userId, status: { in: ["PAID", "COMPLETED"] } } }),
      prisma.order.aggregate({
        where: { userId, status: { in: ["PAID", "COMPLETED"] } },
        _sum: { total: true },
      }),
      prisma.attendance.count({ where: { userId } }),
      prisma.attendance.findFirst({
        where: { userId },
        orderBy: { checkInAt: "desc" },
        select: { checkInAt: true },
      }),
      prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, status: true, total: true, createdAt: true },
      }),
      prisma.attendance.findMany({
        where: { userId },
        orderBy: { checkInAt: "desc" },
        take: 5,
        select: { id: true, checkInAt: true, checkOutAt: true, createdAt: true },
      }),
    ]);

  const totalSpent = paidTotalAgg._sum.total ?? 0;

  return {
    user,
    activeMembership,
    lastAttendanceAt: lastAttendance?.checkInAt ?? null,
    stats: { ordersCount, paidOrdersCount, totalSpent, attendancesCount },
    recentOrders,
    recentAttendances,
  };
}

