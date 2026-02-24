import type { Context } from "elysia";
import type { Role } from "@prisma/client";
import {
  OrderError,
  createOrder,
  createOrderFromCart,
  getOrder,
  listAllOrders,
  listOrders,
} from "./orders.service";

type ElysiaSet = Context["set"];

function statusForOrderError(code: string) {
  switch (code) {
    case "CART_EMPTY":
    case "INVALID_ITEMS":
    case "PRODUCT_INACTIVE":
      return 400;
    case "PRODUCT_NOT_FOUND":
    case "ORDER_NOT_FOUND":
      return 404;
    case "INSUFFICIENT_STOCK":
      return 409;
    case "FORBIDDEN":
      return 403;
    default:
      return 400;
  }
}

export async function createOrderController({
  authUser,
  body,
  set,
}: {
  authUser: { id: string; role: Role } | null;
  body: { items: { productId: string; quantity: number }[] };
  set: ElysiaSet;
}) {
  if (!authUser) {
    set.status = 401;
    return { error: "Unauthorized" };
  }

  try {
    const order = await createOrder(authUser.id, body.items);
    set.status = 201;
    return { order };
  } catch (error) {
    if (error instanceof OrderError) {
      set.status = statusForOrderError(error.code);
      return { error: error.message };
    }
    set.status = 500;
    return { error: "Internal Server Error" };
  }
}

export async function createOrderFromCartController({
  authUser,
  set,
}: {
  authUser: { id: string } | null;
  set: ElysiaSet;
}) {
  if (!authUser) {
    set.status = 401;
    return { error: "Unauthorized" };
  }

  try {
    const order = await createOrderFromCart(authUser.id);
    set.status = 201;
    return { order };
  } catch (error) {
    if (error instanceof OrderError) {
      set.status = statusForOrderError(error.code);
      return { error: error.message };
    }
    set.status = 500;
    return { error: "Internal Server Error" };
  }
}

export async function listOrdersController({
  authUser,
  set,
}: {
  authUser: { id: string } | null;
  set: ElysiaSet;
}) {
  if (!authUser) {
    set.status = 401;
    return { error: "Unauthorized" };
  }

  return await listOrders(authUser.id);
}

export async function listAllOrdersController({
  authUser,
  set,
}: {
  authUser: { id: string; role: Role } | null;
  set: ElysiaSet;
}) {
  if (!authUser) {
    set.status = 401;
    return { error: "Unauthorized" };
  }

  const isPrivileged = authUser.role === "ADMIN" || authUser.role === "BACKOFFICE";
  if (!isPrivileged) {
    set.status = 403;
    return { error: "Forbidden" };
  }

  return await listAllOrders();
}

export async function getOrderController({
  authUser,
  params,
  set,
}: {
  authUser: { id: string; role: Role } | null;
  params: { id: string };
  set: ElysiaSet;
}) {
  if (!authUser) {
    set.status = 401;
    return { error: "Unauthorized" };
  }

  try {
    return await getOrder(params.id, authUser);
  } catch (error) {
    if (error instanceof OrderError) {
      set.status = statusForOrderError(error.code);
      return { error: error.message };
    }

    set.status = 500;
    return { error: "Internal Server Error" };
  }
}
