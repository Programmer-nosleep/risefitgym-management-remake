import type { Context } from "elysia";
import { CartError, addCartItem, getCart, removeCartItem, updateCartItem } from "./cart.service";

type ElysiaSet = Context["set"];

export async function getCartController({
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

  return await getCart(authUser.id);
}

export async function addCartItemController({
  authUser,
  body,
  set,
}: {
  authUser: { id: string } | null;
  body: { productId: string; quantity: number };
  set: ElysiaSet;
}) {
  if (!authUser) {
    set.status = 401;
    return { error: "Unauthorized" };
  }

  try {
    return await addCartItem(authUser.id, body);
  } catch (error) {
    if (error instanceof CartError) {
      set.status =
        error.code === "PRODUCT_NOT_FOUND"
          ? 404
          : error.code === "ITEM_NOT_FOUND"
            ? 404
            : error.code === "PRODUCT_INACTIVE"
              ? 400
              : 409;
      return { error: error.message };
    }

    set.status = 500;
    return { error: "Internal Server Error" };
  }
}

export async function updateCartItemController({
  authUser,
  params,
  body,
  set,
}: {
  authUser: { id: string } | null;
  params: { itemId: string };
  body: { quantity: number };
  set: ElysiaSet;
}) {
  if (!authUser) {
    set.status = 401;
    return { error: "Unauthorized" };
  }

  try {
    return await updateCartItem(authUser.id, { itemId: params.itemId, quantity: body.quantity });
  } catch (error) {
    if (error instanceof CartError) {
      set.status =
        error.code === "PRODUCT_NOT_FOUND"
          ? 404
          : error.code === "ITEM_NOT_FOUND"
            ? 404
            : error.code === "PRODUCT_INACTIVE"
              ? 400
              : 409;
      return { error: error.message };
    }

    set.status = 500;
    return { error: "Internal Server Error" };
  }
}

export async function removeCartItemController({
  authUser,
  params,
  set,
}: {
  authUser: { id: string } | null;
  params: { itemId: string };
  set: ElysiaSet;
}) {
  if (!authUser) {
    set.status = 401;
    return { error: "Unauthorized" };
  }

  try {
    return await removeCartItem(authUser.id, params.itemId);
  } catch (error) {
    if (error instanceof CartError) {
      set.status = 404;
      return { error: error.message };
    }

    set.status = 500;
    return { error: "Internal Server Error" };
  }
}
