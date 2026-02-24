import type { Context } from "elysia";
import type { Role } from "@prisma/client";
import {
  AttendanceError,
  createAttendanceQr,
  listAttendances,
  listMyAttendances,
  scanAttendance,
  type AttendanceAction,
} from "./attendance.service";

type ElysiaSet = Context["set"];

function statusForAttendanceError(code: string) {
  switch (code) {
    case "INVALID_QR_DATA":
    case "LAT_LNG_REQUIRED":
    case "OUT_OF_RANGE":
      return 400;
    case "USER_NOT_FOUND":
      return 404;
    case "MEMBERSHIP_REQUIRED":
      return 403;
    case "ALREADY_CHECKED_IN":
    case "NO_ACTIVE_CHECK_IN":
      return 409;
    default:
      return 400;
  }
}

export async function myAttendancesController({
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

  return await listMyAttendances(authUser.id);
}

export async function attendanceQrController({
  authUser,
  set,
}: {
  authUser: { id: string; name: string; email: string; role: Role } | null;
  set: ElysiaSet;
}) {
  if (!authUser) {
    set.status = 401;
    return { error: "Unauthorized" };
  }

  try {
    const { qrData, expiresAt } = await createAttendanceQr(authUser.id);
    return {
      qrData,
      expiresAt: expiresAt.toISOString(),
      user: { id: authUser.id, name: authUser.name, email: authUser.email, role: authUser.role },
    };
  } catch {
    set.status = 500;
    return { error: "Internal Server Error" };
  }
}

export async function listAttendancesController() {
  return await listAttendances();
}

export async function scanAttendanceController({
  authUser,
  body,
  set,
}: {
  authUser: { id: string } | null;
  body: {
    qrData: string;
    action?: AttendanceAction;
    latitude?: number;
    longitude?: number;
    locationText?: string;
  };
  set: ElysiaSet;
}) {
  if (!authUser) {
    set.status = 401;
    return { error: "Unauthorized" };
  }

  try {
    return await scanAttendance({
      scannedByUserId: authUser.id,
      qrData: body.qrData,
      action: body.action,
      latitude: body.latitude,
      longitude: body.longitude,
      locationText: body.locationText,
    });
  } catch (error) {
    if (error instanceof AttendanceError) {
      set.status = statusForAttendanceError(error.code);
      return { error: error.message, ...(error.details ?? {}) };
    }

    set.status = 500;
    return { error: "Internal Server Error" };
  }
}
