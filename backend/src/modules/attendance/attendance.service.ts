import { prisma } from "../../../prisma/schema";
import { verifyAttendanceToken, signAttendanceToken } from "../../../utils/jwt";
import { env } from "../../config/env";

export type AttendanceAction = "TOGGLE" | "CHECK_IN" | "CHECK_OUT";

export type AttendanceErrorCode =
  | "INVALID_QR_DATA"
  | "USER_NOT_FOUND"
  | "MEMBERSHIP_REQUIRED"
  | "LAT_LNG_REQUIRED"
  | "OUT_OF_RANGE"
  | "ALREADY_CHECKED_IN"
  | "NO_ACTIVE_CHECK_IN";

export class AttendanceError extends Error {
  code: AttendanceErrorCode;
  details?: Record<string, unknown>;

  constructor(code: AttendanceErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function listMyAttendances(userId: string) {
  const attendances = await prisma.attendance.findMany({
    where: { userId },
    orderBy: { checkInAt: "desc" },
    select: {
      id: true,
      checkInAt: true,
      checkOutAt: true,
      latitude: true,
      longitude: true,
      locationText: true,
      createdAt: true,
      updatedAt: true,
      scannedByUser: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  return { attendances };
}

export async function createAttendanceQr(userId: string, options?: { expiresInMs?: number }) {
  const expiresInMs = options?.expiresInMs ?? 5 * 60 * 1000;
  const expiresAt = new Date(Date.now() + expiresInMs);
  const qrData = await signAttendanceToken({ userId }, expiresAt);

  return { qrData, expiresAt };
}

export async function listAttendances(options?: { take?: number }) {
  const attendances = await prisma.attendance.findMany({
    orderBy: { checkInAt: "desc" },
    take: options?.take ?? 200,
    select: {
      id: true,
      checkInAt: true,
      checkOutAt: true,
      latitude: true,
      longitude: true,
      locationText: true,
      createdAt: true,
      updatedAt: true,
      user: { select: { id: true, name: true, email: true, role: true } },
      scannedByUser: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  return { attendances };
}

export async function scanAttendance(input: {
  scannedByUserId: string | null;
  qrData: string;
  action?: AttendanceAction;
  latitude?: number;
  longitude?: number;
  locationText?: string;
}) {
  const decoded = await (async () => {
    try {
      return await verifyAttendanceToken(input.qrData);
    } catch {
      return null;
    }
  })();

  if (!decoded) throw new AttendanceError("INVALID_QR_DATA", "Invalid QR data");

  const scannedUser = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!scannedUser) throw new AttendanceError("USER_NOT_FOUND", "User not found");

  if (scannedUser.role === "USER") {
    const now = new Date();
    const activeMembership = await prisma.userMembership.findFirst({
      where: { userId: scannedUser.id, status: "ACTIVE", endDate: { gte: now } },
      select: { id: true },
    });

    if (!activeMembership) throw new AttendanceError("MEMBERSHIP_REQUIRED", "Active membership required");
  }

  const gym = env.gym;
  let distanceMeters: number | null = null;

  if (gym) {
    if (typeof input.latitude !== "number" || typeof input.longitude !== "number") {
      throw new AttendanceError("LAT_LNG_REQUIRED", "latitude and longitude are required");
    }

    distanceMeters = haversineMeters(input.latitude, input.longitude, gym.lat, gym.lng);
    if (distanceMeters > gym.radiusMeters) {
      throw new AttendanceError(
        "OUT_OF_RANGE",
        `Anda harus berada di lokasi gym (maks ${gym.radiusMeters} meter)`,
        { distanceMeters, radiusMeters: gym.radiusMeters }
      );
    }
  }

  const action: AttendanceAction = input.action ?? "TOGGLE";
  const now = new Date();

  const open = await prisma.attendance.findFirst({
    where: { userId: scannedUser.id, checkOutAt: null },
    orderBy: { checkInAt: "desc" },
    select: { id: true },
  });

  if (action === "CHECK_IN" && open) throw new AttendanceError("ALREADY_CHECKED_IN", "User is already checked in");
  if (action === "CHECK_OUT" && !open) throw new AttendanceError("NO_ACTIVE_CHECK_IN", "No active check-in found");

  const attendance =
    action === "CHECK_OUT" || (action === "TOGGLE" && open)
      ? await prisma.attendance.update({
          where: { id: open!.id },
          data: {
            checkOutAt: now,
            scannedByUserId: input.scannedByUserId,
            latitude: input.latitude ?? null,
            longitude: input.longitude ?? null,
            locationText: input.locationText ?? null,
          },
          select: {
            id: true,
            checkInAt: true,
            checkOutAt: true,
            latitude: true,
            longitude: true,
            locationText: true,
            createdAt: true,
            updatedAt: true,
            user: { select: { id: true, name: true, email: true, role: true } },
            scannedByUser: { select: { id: true, name: true, email: true, role: true } },
          },
        })
      : await prisma.attendance.create({
          data: {
            userId: scannedUser.id,
            scannedByUserId: input.scannedByUserId,
            checkInAt: now,
            latitude: input.latitude ?? null,
            longitude: input.longitude ?? null,
            locationText: input.locationText ?? null,
          },
          select: {
            id: true,
            checkInAt: true,
            checkOutAt: true,
            latitude: true,
            longitude: true,
            locationText: true,
            createdAt: true,
            updatedAt: true,
            user: { select: { id: true, name: true, email: true, role: true } },
            scannedByUser: { select: { id: true, name: true, email: true, role: true } },
          },
        });

  return { attendance, distanceMeters };
}
