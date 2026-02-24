import { Elysia, t } from "elysia";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  listMembershipsController,
  myMembershipController,
  subscribeMembershipController,
} from "../modules/membership/membership.controller";

export const membershipRoutes = new Elysia({ prefix: "/memberships" })
  .use(authMiddleware)
  .get("/", listMembershipsController)
  .get("/me", myMembershipController)
  .post("/subscribe", subscribeMembershipController, {
    body: t.Object({ membershipId: t.String() }),
  });
