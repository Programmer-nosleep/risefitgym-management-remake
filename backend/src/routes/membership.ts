import { Elysia, t } from "elysia";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireRoles } from "../middleware/roles.middleware";
import {
  createMembershipController,
  deleteMembershipController,
  listMembershipsController,
  myMembershipController,
  subscribeMembershipController,
  updateMembershipController,
} from "../modules/membership/membership.controller";

export const membershipRoutes = new Elysia({ prefix: "/memberships" })
  .use(authMiddleware)
  .get("/", listMembershipsController)
  .get("/me", myMembershipController)
  .post("/subscribe", subscribeMembershipController, {
    body: t.Object({ membershipId: t.String() }),
  })
  .use(requireRoles(["ADMIN", "BACKOFFICE"]))
  .post("/", createMembershipController, {
    body: t.Object({
      name: t.String({ minLength: 1 }),
      description: t.String({ minLength: 1 }),
      price: t.Integer({ minimum: 0 }),
      durationDays: t.Integer({ minimum: 1 }),
    }),
  })
  .patch("/:id", updateMembershipController, {
    params: t.Object({ id: t.String() }),
    body: t.Object({
      name: t.Optional(t.String({ minLength: 1 })),
      description: t.Optional(t.String({ minLength: 1 })),
      price: t.Optional(t.Integer({ minimum: 0 })),
      durationDays: t.Optional(t.Integer({ minimum: 1 })),
    }),
  })
  .delete("/:id", deleteMembershipController, {
    params: t.Object({ id: t.String() }),
  });
