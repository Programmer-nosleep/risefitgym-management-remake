import { Elysia, t } from "elysia";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  addCartItemController,
  getCartController,
  removeCartItemController,
  updateCartItemController,
} from "../modules/cart/cart.controller";

export const cartRoutes = new Elysia({ prefix: "/cart" })
  .use(authMiddleware)
  .get("/", getCartController)
  .post("/items", addCartItemController, {
    body: t.Object({
      productId: t.String(),
      quantity: t.Integer({ minimum: 1 }),
    }),
  })
  .patch("/items/:itemId", updateCartItemController, {
    params: t.Object({ itemId: t.String() }),
    body: t.Object({ quantity: t.Integer() }),
  })
  .delete("/items/:itemId", removeCartItemController, {
    params: t.Object({ itemId: t.String() }),
  });
