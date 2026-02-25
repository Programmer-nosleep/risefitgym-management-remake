import { Elysia, t } from "elysia";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireRoles } from "../middleware/roles.middleware";
import {
  getUserProfileController,
  myProfileController,
  updateMyProfileController,
} from "../modules/profile/profile.controller";

export const profileRoutes = new Elysia({ prefix: "/profile" })
  .use(authMiddleware)
  .get("/me", myProfileController)
  .patch(
    "/me",
    updateMyProfileController,
    {
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1 })),
        currentPassword: t.Optional(t.String({ minLength: 1 })),
        newPassword: t.Optional(t.String({ minLength: 8 })),
      }),
    }
  )
  .use(requireRoles(["ADMIN", "BACKOFFICE"]))
  .get("/:id", getUserProfileController, { params: t.Object({ id: t.String() }) });

