import { Elysia } from "elysia";
import { env } from "./config/env";
import { errorMiddleware } from "./middleware/error.middleware";
import { corsMiddleware } from "./middleware/cors.middleware";
import { agentRoutes } from "./routes/agents";
import { authRoutes } from "./routes/auth";
import { cartRoutes } from "./routes/cart";
import { invoiceRoutes } from "./routes/invoices";
import { membershipRoutes } from "./routes/membership";
import { orderRoutes } from "./routes/orders";
import { paymentRoutes } from "./routes/payment";
import { productRoutes } from "./routes/products";
import { attendanceRoutes } from "./routes/attendance";
import { userRoutes } from "./routes/users";
import { profileRoutes } from "./routes/profile";
import { adminFinanceRoutes } from "./routes/adminFinance";

const app = new Elysia()
  .use(corsMiddleware)
  .use(errorMiddleware)
  .get("/", () => ({ ok: true, service: "risefit-backend" }))
  .use(authRoutes)
  .use(profileRoutes)
  .use(membershipRoutes)
  .use(userRoutes)
  .use(productRoutes)
  .use(agentRoutes)
  .use(cartRoutes)
  .use(attendanceRoutes)
  .use(orderRoutes)
  .use(invoiceRoutes)
  .use(adminFinanceRoutes)
  .use(paymentRoutes)
  .listen(env.port);

console.log(`Elysia is running at http://${app.server?.hostname}:${app.server?.port}`);
