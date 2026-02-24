import { Elysia, t } from "elysia";
import { prisma } from "../../prisma/schema";
import { authMiddleware } from "../middleware/auth.middleware";
import { midtransWebhookMiddleware } from "../middleware/webhook.middleware";
import { createPaymentTokenController, midtransNotificationController } from "../modules/paymets/paymentes.controller";

export const paymentRoutes = new Elysia({ prefix: "/payment" })
  .use(midtransWebhookMiddleware)
  .post("/notification", midtransNotificationController)
  .use(authMiddleware)
  .post(
    "/token",
    async ({ authUser, body, set }) => {
      if (!authUser) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const order = await prisma.order.findUnique({
        where: { id: body.orderId },
        select: { id: true, userId: true },
      });

      if (!order) {
        set.status = 404;
        return { error: "Order not found" };
      }

      const isPrivileged = authUser.role === "ADMIN" || authUser.role === "BACKOFFICE";
      if (!isPrivileged && order.userId !== authUser.id) {
        set.status = 403;
        return { error: "Forbidden" };
      }

      return await createPaymentTokenController({ body, set });
    },
    {
      body: t.Object({ orderId: t.String() }),
    }
  );
