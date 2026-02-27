import { Elysia, t } from "elysia";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireRoles } from "../middleware/roles.middleware";
import { prisma } from "../../prisma/schema";
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
  })
  .use(requireRoles(["ADMIN", "BACKOFFICE"]))
  .get("/", async () => {
    const [invoices, aggregate] = await prisma.$transaction([
      prisma.invoice.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderId: true,
          userId: true,
          amount: true,
          paymentMethod: true,
          status: true,
          transactionId: true,
          createdAt: true,
          updatedAt: true,
          user: { select: { id: true, name: true, email: true } },
          order: {
            select: {
              id: true,
              status: true,
              total: true,
              createdAt: true,
              updatedAt: true,
              items: {
                select: {
                  id: true,
                  quantity: true,
                  unitPrice: true,
                  product: { select: { id: true, sku: true, name: true } },
                },
              },
            },
          },
        },
      }),
      prisma.invoice.aggregate({ _sum: { amount: true } }),
    ]);

    return { invoices, summary: { totalAmount: aggregate._sum.amount ?? 0 } };
  });

