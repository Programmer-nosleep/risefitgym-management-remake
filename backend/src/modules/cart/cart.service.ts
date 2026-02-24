import { prisma } from "../../../prisma/schema";

export type CartErrorCode =
  | "PRODUCT_NOT_FOUND"
  | "PRODUCT_INACTIVE"
  | "INSUFFICIENT_STOCK"
  | "ITEM_NOT_FOUND";

export class CartError extends Error {
  code: CartErrorCode;

  constructor(code: CartErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export async function getCart(userId: string) {
  const cart =
    (await prisma.cart.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        items: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            quantity: true,
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                description: true,
                price: true,
                stock: true,
                isActive: true,
              },
            },
          },
        },
      },
    })) ??
    (await prisma.cart.create({
      data: { userId },
      select: {
        id: true,
        userId: true,
        items: {
          select: {
            id: true,
            quantity: true,
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                description: true,
                price: true,
                stock: true,
                isActive: true,
              },
            },
          },
        },
      },
    }));

  const total = cart.items.reduce((sum, item) => sum + item.quantity * item.product.price, 0);
  return { cart, total };
}

export async function addCartItem(userId: string, input: { productId: string; quantity: number }) {
  if (!Number.isFinite(input.quantity) || input.quantity <= 0) {
    throw new CartError("INSUFFICIENT_STOCK", "Quantity must be greater than 0");
  }

  await prisma.$transaction(async (tx) => {
    const cart =
      (await tx.cart.findUnique({
        where: { userId },
        select: { id: true },
      })) ?? (await tx.cart.create({ data: { userId }, select: { id: true } }));

    const product = await tx.product.findUnique({
      where: { id: input.productId },
      select: { id: true, stock: true, isActive: true },
    });

    if (!product) throw new CartError("PRODUCT_NOT_FOUND", "Product not found");
    if (!product.isActive) throw new CartError("PRODUCT_INACTIVE", "Product is inactive");

    const existing = await tx.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId: input.productId } },
      select: { id: true, quantity: true },
    });

    const nextQuantity = (existing?.quantity ?? 0) + input.quantity;
    if (nextQuantity > product.stock) {
      throw new CartError("INSUFFICIENT_STOCK", "Insufficient stock");
    }

    if (existing) {
      await tx.cartItem.update({
        where: { id: existing.id },
        data: { quantity: nextQuantity },
      });
      return;
    }

    await tx.cartItem.create({
      data: {
        cartId: cart.id,
        productId: input.productId,
        quantity: nextQuantity,
      },
    });
  });

  return await getCart(userId);
}

export async function updateCartItem(userId: string, input: { itemId: string; quantity: number }) {
  if (!Number.isFinite(input.quantity)) {
    throw new CartError("INSUFFICIENT_STOCK", "Quantity must be a number");
  }

  await prisma.$transaction(async (tx) => {
    const cart = await tx.cart.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!cart) throw new CartError("ITEM_NOT_FOUND", "Cart not found");

    const item = await tx.cartItem.findFirst({
      where: { id: input.itemId, cartId: cart.id },
      select: { id: true, productId: true },
    });
    if (!item) throw new CartError("ITEM_NOT_FOUND", "Cart item not found");

    if (input.quantity <= 0) {
      await tx.cartItem.delete({ where: { id: item.id } });
      return;
    }

    const product = await tx.product.findUnique({
      where: { id: item.productId },
      select: { stock: true, isActive: true },
    });
    if (!product) throw new CartError("PRODUCT_NOT_FOUND", "Product not found");
    if (!product.isActive) throw new CartError("PRODUCT_INACTIVE", "Product is inactive");
    if (input.quantity > product.stock) throw new CartError("INSUFFICIENT_STOCK", "Insufficient stock");

    await tx.cartItem.update({
      where: { id: item.id },
      data: { quantity: input.quantity },
    });
  });

  return await getCart(userId);
}

export async function removeCartItem(userId: string, itemId: string) {
  await prisma.$transaction(async (tx) => {
    const cart = await tx.cart.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!cart) throw new CartError("ITEM_NOT_FOUND", "Cart not found");

    const item = await tx.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
      select: { id: true },
    });

    if (!item) throw new CartError("ITEM_NOT_FOUND", "Cart item not found");
    await tx.cartItem.delete({ where: { id: item.id } });
  });

  return await getCart(userId);
}
