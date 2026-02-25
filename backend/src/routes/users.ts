import { Elysia, t } from "elysia";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireRoles } from "../middleware/roles.middleware";
import {
  getUserController,
  listUsersController,
  meController,
  setUserRoleController,
  updateMeController,
  deleteUserController,
} from "../modules/users/users.controller";

export const userRoutes = new Elysia({ prefix: "/users" })
  // triggering lint check
  .use(authMiddleware)
  .get("/me", meController)
  .patch(
    "/me",
    updateMeController,
    {
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1 })),
        currentPassword: t.Optional(t.String({ minLength: 1 })),
        newPassword: t.Optional(t.String({ minLength: 8 })),
      }),
    }
  )
  .use(requireRoles(["ADMIN", "BACKOFFICE"]))
  .get("/", listUsersController)
  .get("/:id", getUserController, { params: t.Object({ id: t.String() }) })
  .use(requireRoles(["ADMIN"]))
  .patch(
    "/:id/role",
    setUserRoleController,
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        role: t.Union([t.Literal("USER"), t.Literal("ADMIN"), t.Literal("BACKOFFICE")]),
      }),
    }
  )
  .delete("/:id", deleteUserController, { params: t.Object({ id: t.String() }) });

