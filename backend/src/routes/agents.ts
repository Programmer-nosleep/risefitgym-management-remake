import { Elysia, t } from "elysia";
import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/schema";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireRoles } from "../middleware/roles.middleware";

export const agentRoutes = new Elysia({ prefix: "/agents" })
  .use(authMiddleware)
  .use(requireRoles(["ADMIN", "BACKOFFICE"]))
  .get("/", async () => {
    const agents = await prisma.agent.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { agents };
  })
  .post(
    "/",
    async ({ body, set }) => {
      try {
        const agent = await prisma.agent.create({
          data: {
            name: body.name,
            email: body.email,
            phone: body.phone,
          },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        set.status = 201;
        return { agent };
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          set.status = 409;
          return { error: "Agent email already exists" };
        }

        set.status = 500;
        return { error: "Internal Server Error" };
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        email: t.Optional(t.String({ format: "email" })),
        phone: t.Optional(t.String()),
      }),
    }
  )
  .patch(
    "/:id",
    async ({ params, body, set }) => {
      const name = typeof body.name === "string" ? body.name.trim() : undefined;
      const emailRaw = typeof body.email === "string" ? body.email.trim() : undefined;
      const phoneRaw = typeof body.phone === "string" ? body.phone.trim() : undefined;

      const hasName = typeof name === "string" && name.length > 0;
      const hasEmail = typeof emailRaw === "string";
      const hasPhone = typeof phoneRaw === "string";

      if (!hasName && !hasEmail && !hasPhone) {
        set.status = 400;
        return { error: "No changes to update" };
      }

      const email = hasEmail ? (emailRaw === "" ? null : emailRaw) : undefined;
      const phone = hasPhone ? (phoneRaw === "" ? null : phoneRaw) : undefined;

      try {
        const agent = await prisma.agent.update({
          where: { id: params.id },
          data: {
            ...(hasName ? { name } : {}),
            ...(hasEmail ? { email } : {}),
            ...(hasPhone ? { phone } : {}),
          },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        return { agent };
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2025") {
            set.status = 404;
            return { error: "Agent not found" };
          }
          if (error.code === "P2002") {
            set.status = 409;
            return { error: "Agent email already exists" };
          }
        }

        set.status = 500;
        return { error: "Internal Server Error" };
      }
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1 })),
        email: t.Optional(t.Union([t.String({ format: "email" }), t.Literal("")])),
        phone: t.Optional(t.String()),
      }),
    }
  )
  .delete(
    "/:id",
    async ({ params, set }) => {
      try {
        const agent = await prisma.agent.delete({
          where: { id: params.id },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        return { agent };
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
          set.status = 404;
          return { error: "Agent not found" };
        }

        set.status = 500;
        return { error: "Internal Server Error" };
      }
    },
    {
      params: t.Object({ id: t.String() }),
    }
  )
  .get(
    "/:id/movements",
    async ({ params, set }) => {
      const agent = await prisma.agent.findUnique({
        where: { id: params.id },
        select: { id: true },
      });

      if (!agent) {
        set.status = 404;
        return { error: "Agent not found" };
      }

      const movements = await prisma.inventoryMovement.findMany({
        where: { agentId: params.id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          type: true,
          quantity: true,
          note: true,
          createdAt: true,
          product: { select: { id: true, sku: true, name: true } },
        },
      });

      return { movements };
    },
    {
      params: t.Object({ id: t.String() }),
    }
  );

