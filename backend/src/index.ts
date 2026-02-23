import { Elysia } from "elysia";
import { paymentRoutes } from "./routes/payment";

const app = new Elysia()
  .get("/", () => "Hello Elysia")
  .use(paymentRoutes)
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

