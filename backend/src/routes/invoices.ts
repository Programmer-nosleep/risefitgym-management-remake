import { Elysia, t } from "elysia";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  createInvoiceController,
  getInvoiceController,
  invoiceByOrderController,
} from "../modules/invoice/invoice.controller";

export const invoiceRoutes = new Elysia({ prefix: "/invoices" })
  .use(authMiddleware)
  .post("/", createInvoiceController, {
    body: t.Object({ orderId: t.String() }),
  })
  .get("/order/:orderId", invoiceByOrderController, {
    params: t.Object({ orderId: t.String() }),
  })
  .get("/:id", getInvoiceController, {
    params: t.Object({ id: t.String() }),
  });

