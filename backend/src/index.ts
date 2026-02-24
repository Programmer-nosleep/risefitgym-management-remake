import { Elysia } from "elysia";
import { env } from "./config/env";
import { errorMiddleware } from "./middleware/error.middleware";
import { agentRoutes } from "./routes/agents";
import { authRoutes } from "./routes/auth";
import { cartRoutes } from "./routes/cart";
import { membershipRoutes } from "./routes/membership";
import { orderRoutes } from "./routes/orders";
import { paymentRoutes } from "./routes/payment";
import { productRoutes } from "./routes/products";
import { attendanceRoutes } from "./routes/attendance";
import { userRoutes } from "./routes/users";

const app = new Elysia()
  .use(errorMiddleware)
  .get("/", () => ({ ok: true, service: "risefit-backend" }))
  .use(authRoutes)
  .use(membershipRoutes)
  .use(userRoutes)
  .use(productRoutes)
  .use(agentRoutes)
  .use(cartRoutes)
  .use(attendanceRoutes)
  .use(orderRoutes)
  .use(paymentRoutes)
  .listen(env.port);

console.log(`Elysia is running at http://${app.server?.hostname}:${app.server?.port}`);
