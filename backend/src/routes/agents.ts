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

