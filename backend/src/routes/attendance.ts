import { Elysia, t } from "elysia";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireRoles } from "../middleware/roles.middleware";
import {
  attendanceQrController,
  listAttendancesController,
  myAttendancesController,
  scanAttendanceController,
} from "../modules/attendance/attendance.controller";

export const attendanceRoutes = new Elysia({ prefix: "/attendance" })
  .use(authMiddleware)
  .get("/me", myAttendancesController)
  .get("/qr", attendanceQrController)
  .use(requireRoles(["ADMIN", "BACKOFFICE"]))
  .get("/", listAttendancesController)
  .post(
    "/scan",
    scanAttendanceController,
    {
      body: t.Object({
        qrData: t.String(),
        action: t.Optional(t.Union([t.Literal("TOGGLE"), t.Literal("CHECK_IN"), t.Literal("CHECK_OUT")])),
        latitude: t.Optional(t.Number()),
        longitude: t.Optional(t.Number()),
        locationText: t.Optional(t.String()),
      }),
    }
  );
