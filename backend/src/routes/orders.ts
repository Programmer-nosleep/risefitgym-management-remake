import { Elysia, t } from "elysia";
import { prisma } from "../../prisma/schema";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  createOrderController,
  createOrderFromCartController,
  getOrderController,
  listAllOrdersController,
  listOrdersController,
} from "../modules/orders/orders.controller";
import { createMidtransCheckoutForOrder } from "../modules/paymets/payments.service";

export const orderRoutes = new Elysia({ prefix: "/orders" })
  .use(authMiddleware)
  .get("/", listOrdersController)
  .get("/all", listAllOrdersController)
  .get("/:id", getOrderController, {
    params: t.Object({ id: t.String() }),
  })
  .post("/", createOrderController, {
    body: t.Object({
      items: t.Array(
        t.Object({
          productId: t.String(),
          quantity: t.Integer({ minimum: 1 }),
        })
      ),
    }),
  })
  .post("/from-cart", createOrderFromCartController)
  .post(
    "/:id/checkout",
    async ({ authUser, params, set }) => {
      if (!authUser) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const order = await prisma.order.findUnique({
        where: { id: params.id },
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

      try {
        return await createMidtransCheckoutForOrder(order.id);
      } catch (error: any) {
        set.status = 400;
        return { error: error?.message ?? "Bad request" };
      }
    },
    {
      params: t.Object({ id: t.String() }),
    }
  );
