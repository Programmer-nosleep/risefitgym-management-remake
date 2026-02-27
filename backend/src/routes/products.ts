import { Elysia, t } from "elysia";
import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { prisma } from "../../prisma/schema";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireRoles } from "../middleware/roles.middleware";

const PG_INT_MAX = 2_147_483_647;

function slugifySkuBase(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-")
    .toUpperCase();
}

function generateProductSku(name: string) {
  const base = slugifySkuBase(name).slice(0, 16);
  const suffix = randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();

  if (!base) return `RF-${suffix}`;
  return `RF-${base}-${suffix}`;
}

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
      const stock = body.stock ?? 0;

      if (!Number.isSafeInteger(body.price) || body.price < 0 || body.price > PG_INT_MAX) {
        set.status = 400;
        return { error: `Harga maksimal adalah ${PG_INT_MAX}.` };
      }

      if (!Number.isSafeInteger(stock) || stock < 0 || stock > PG_INT_MAX) {
        set.status = 400;
        return { error: `Stok maksimal adalah ${PG_INT_MAX}.` };
      }

      const requestedSku = body.sku?.trim() ?? "";
      const isSkuProvided = requestedSku !== "";

      let sku = isSkuProvided ? requestedSku : generateProductSku(body.name);

      for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
          const product = await prisma.product.create({
            data: {
              sku,
              name: body.name,
              description: body.description,
              price: body.price,
              stock,
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
            if (isSkuProvided) {
              set.status = 409;
              return { error: "SKU already exists" };
            }

            sku = generateProductSku(body.name);
            continue;
          }

          set.status = 500;
          return { error: "Internal Server Error" };
        }
      }

      set.status = 500;
      return { error: "Failed to generate unique SKU" };
    },
    {
      body: t.Object({
        sku: t.Optional(t.String({ minLength: 1 })),
        name: t.String({ minLength: 1 }),
        description: t.Optional(t.String()),
        price: t.Integer({ minimum: 0, maximum: PG_INT_MAX }),
        stock: t.Optional(t.Integer({ minimum: 0, maximum: PG_INT_MAX })),
        isActive: t.Optional(t.Boolean()),
      }),
    }
  )
  .patch(
    "/:id",
    async ({ params, body, set }) => {
      if (
        typeof body.price === "number" &&
        (!Number.isSafeInteger(body.price) || body.price < 0 || body.price > PG_INT_MAX)
      ) {
        set.status = 400;
        return { error: `Harga maksimal adalah ${PG_INT_MAX}.` };
      }

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
        price: t.Optional(t.Integer({ minimum: 0, maximum: PG_INT_MAX })),
        isActive: t.Optional(t.Boolean()),
      }),
    }
  )
  .delete(
    "/:id",
    async ({ params, set }) => {
      try {
        const product = await prisma.product.update({
          where: { id: params.id },
          data: { isActive: false },
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

        set.status = 500;
        return { error: "Internal Server Error" };
      }
    },
    {
      params: t.Object({ id: t.String() }),
    }
  )
  .post(
    "/:id/stock/in",
    async ({ params, body, set }) => {
      if (body.quantity <= 0) {
        set.status = 400;
        return { error: "Quantity must be greater than 0" };
      }

      if (!Number.isSafeInteger(body.quantity) || body.quantity > PG_INT_MAX) {
        set.status = 400;
        return { error: `Quantity maksimal adalah ${PG_INT_MAX}.` };
      }

      try {
        const product = await prisma.$transaction(async (tx) => {
          if (body.agentId) {
            const agent = await tx.agent.findUnique({
              where: { id: body.agentId },
              select: { id: true },
            });
            if (!agent) {
              return "AGENT_NOT_FOUND" as const;
            }
          }

          const existing = await tx.product.findUnique({
            where: { id: params.id },
            select: { stock: true },
          });

          if (!existing) return "PRODUCT_NOT_FOUND" as const;

          const nextStock = existing.stock + body.quantity;
          if (!Number.isSafeInteger(nextStock) || nextStock > PG_INT_MAX) {
            return "STOCK_TOO_LARGE" as const;
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
              agentId: body.agentId,
              type: "IN",
              quantity: body.quantity,
              note: body.note,
            },
          });

          return updated;
        });

        if (product === "AGENT_NOT_FOUND") {
          set.status = 400;
          return { error: "Agent not found" };
        }

        if (product === "PRODUCT_NOT_FOUND") {
          set.status = 404;
          return { error: "Product not found" };
        }

        if (product === "STOCK_TOO_LARGE") {
          set.status = 400;
          return { error: `Stok maksimal adalah ${PG_INT_MAX}.` };
        }

        return { product };
      } catch (error) {
        set.status = 500;
        return { error: "Internal Server Error" };
      }
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        quantity: t.Integer({ minimum: 1, maximum: PG_INT_MAX }),
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

      if (!Number.isSafeInteger(quantityDelta) || quantityDelta < -PG_INT_MAX || quantityDelta > PG_INT_MAX) {
        set.status = 400;
        return { error: `quantityDelta harus diantara -${PG_INT_MAX} sampai ${PG_INT_MAX}.` };
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

          if (!Number.isSafeInteger(nextStock) || nextStock > PG_INT_MAX) {
            set.status = 400;
            return "STOCK_TOO_LARGE" as const;
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

        if (product === "STOCK_TOO_LARGE") {
          return { error: `Stok maksimal adalah ${PG_INT_MAX}.` };
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
        quantityDelta: t.Integer({ minimum: -PG_INT_MAX, maximum: PG_INT_MAX }),
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
