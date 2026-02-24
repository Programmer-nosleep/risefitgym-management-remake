import { Elysia, t } from "elysia";
import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/schema";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireRoles } from "../middleware/roles.middleware";

export const productRoutes = new Elysia({ prefix: "/products" })
  .use(authMiddleware)
  .get("/", async () => {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        sku: true,
        name: true,
        description: true,
        price: true,
        stock: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { products };
  })
  .get(
    "/:id",
    async ({ params, set }) => {
      const product = await prisma.product.findUnique({
        where: { id: params.id },
        select: {
          id: true,
          sku: true,
          name: true,
          description: true,
          price: true,
          stock: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!product) {
        set.status = 404;
        return { error: "Product not found" };
      }

      return { product };
    },
    {
      params: t.Object({ id: t.String() }),
    }
  )
  .use(requireRoles(["ADMIN", "BACKOFFICE"]))
  .post(
    "/",
    async ({ body, set }) => {
      try {
        const product = await prisma.product.create({
          data: {
            sku: body.sku,
            name: body.name,
            description: body.description,
            price: body.price,
            stock: body.stock ?? 0,
            isActive: body.isActive ?? true,
          },
          select: {
            id: true,
            sku: true,
            name: true,
            description: true,
            price: true,
            stock: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        set.status = 201;
        return { product };
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          set.status = 409;
          return { error: "SKU already exists" };
        }

        set.status = 500;
        return { error: "Internal Server Error" };
      }
    },
    {
      body: t.Object({
        sku: t.String({ minLength: 1 }),
        name: t.String({ minLength: 1 }),
        description: t.Optional(t.String()),
        price: t.Integer({ minimum: 0 }),
        stock: t.Optional(t.Integer({ minimum: 0 })),
        isActive: t.Optional(t.Boolean()),
      }),
    }
  )
  .patch(
    "/:id",
    async ({ params, body, set }) => {
      try {
        const product = await prisma.product.update({
          where: { id: params.id },
          data: {
            sku: body.sku,
            name: body.name,
            description: body.description,
            price: body.price,
            isActive: body.isActive,
          },
          select: {
            id: true,
            sku: true,
            name: true,
            description: true,
            price: true,
            stock: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        return { product };
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
          set.status = 404;
          return { error: "Product not found" };
        }

        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          set.status = 409;
          return { error: "SKU already exists" };
        }

        set.status = 500;
        return { error: "Internal Server Error" };
      }
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        sku: t.Optional(t.String({ minLength: 1 })),
        name: t.Optional(t.String({ minLength: 1 })),
        description: t.Optional(t.String()),
        price: t.Optional(t.Integer({ minimum: 0 })),
        isActive: t.Optional(t.Boolean()),
      }),
    }
  )
  .post(
    "/:id/stock/in",
    async ({ params, body, set }) => {
      if (body.quantity <= 0) {
        set.status = 400;
        return { error: "Quantity must be greater than 0" };
      }

      try {
        const product = await prisma.$transaction(async (tx) => {
          if (body.agentId) {
            const agent = await tx.agent.findUnique({
              where: { id: body.agentId },
              select: { id: true },
            });
            if (!agent) {
              set.status = 400;
              return null;
            }
          }

          const updated = await tx.product.update({
            where: { id: params.id },
            data: { stock: { increment: body.quantity } },
            select: {
              id: true,
              sku: true,
              name: true,
              price: true,
              stock: true,
              isActive: true,
              updatedAt: true,
            },
          });

          await tx.inventoryMovement.create({
            data: {
              productId: params.id,
              agentId: body.agentId,
              type: "IN",
              quantity: body.quantity,
              note: body.note,
            },
          });

          return updated;
        });

        if (product === null) {
          if (set.status !== 400) set.status = 400;
          return { error: "Agent not found" };
        }

        return { product };
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
          set.status = 404;
          return { error: "Product not found" };
        }

        set.status = 500;
        return { error: "Internal Server Error" };
      }
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        quantity: t.Integer({ minimum: 1 }),
        agentId: t.Optional(t.String()),
        note: t.Optional(t.String()),
      }),
    }
  )
  .post(
    "/:id/stock/adjust",
    async ({ params, body, set }) => {
      const quantityDelta = body.quantityDelta;
      if (!Number.isFinite(quantityDelta) || quantityDelta === 0) {
        set.status = 400;
        return { error: "quantityDelta must be a non-zero number" };
      }

      try {
        const product = await prisma.$transaction(async (tx) => {
          const existing = await tx.product.findUnique({
            where: { id: params.id },
            select: { stock: true },
          });

          if (!existing) return null;

          const nextStock = existing.stock + quantityDelta;
          if (nextStock < 0) {
            set.status = 400;
            return "NEGATIVE_STOCK" as const;
          }

          const updated = await tx.product.update({
            where: { id: params.id },
            data: { stock: nextStock },
            select: {
              id: true,
              sku: true,
              name: true,
              price: true,
              stock: true,
              isActive: true,
              updatedAt: true,
            },
          });

          await tx.inventoryMovement.create({
            data: {
              productId: params.id,
              type: "ADJUST",
              quantity: quantityDelta,
              note: body.note,
            },
          });

          return updated;
        });

        if (product === null) {
          set.status = 404;
          return { error: "Product not found" };
        }

        if (product === "NEGATIVE_STOCK") {
          return { error: "Stock cannot go below 0" };
        }

        return { product };
      } catch {
        set.status = 500;
        return { error: "Internal Server Error" };
      }
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        quantityDelta: t.Integer(),
        note: t.Optional(t.String()),
      }),
    }
  )
  .get(
    "/:id/movements",
    async ({ params, set }) => {
      const product = await prisma.product.findUnique({
        where: { id: params.id },
        select: { id: true },
      });

      if (!product) {
        set.status = 404;
        return { error: "Product not found" };
      }

      const movements = await prisma.inventoryMovement.findMany({
        where: { productId: params.id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          type: true,
          quantity: true,
          note: true,
          createdAt: true,
          agent: { select: { id: true, name: true } },
          order: { select: { id: true, status: true } },
        },
      });

      return { movements };
    },
    {
      params: t.Object({ id: t.String() }),
    }
  );
