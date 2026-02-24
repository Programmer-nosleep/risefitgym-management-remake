import type { Role } from "@prisma/client";
import { prisma } from "../../../prisma/schema";

export type OrderErrorCode =
  | "CART_EMPTY"
  | "INVALID_ITEMS"
  | "PRODUCT_NOT_FOUND"
  | "PRODUCT_INACTIVE"
  | "INSUFFICIENT_STOCK"
  | "ORDER_NOT_FOUND"
  | "FORBIDDEN"
  | "INVALID_STATUS";

export class OrderError extends Error {
  code: OrderErrorCode;

  constructor(code: OrderErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

type CreateOrderItemInput = { productId: string; quantity: number };

function normalizeItems(items: CreateOrderItemInput[]) {
  const quantities = new Map<string, number>();
  for (const item of items) {
    if (!item.productId || !Number.isFinite(item.quantity) || item.quantity <= 0) {
      throw new OrderError("INVALID_ITEMS", "Invalid items");
    }
    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  }
  return Array.from(quantities, ([productId, quantity]) => ({ productId, quantity }));
}

export async function createOrder(userId: string, items: CreateOrderItemInput[]) {
  const normalized = normalizeItems(items);
  if (normalized.length === 0) throw new OrderError("INVALID_ITEMS", "Items cannot be empty");

  return await prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({
      where: { id: { in: normalized.map((i) => i.productId) } },
      select: { id: true, price: true, isActive: true },
    });

    if (products.length !== normalized.length) {
      throw new OrderError("PRODUCT_NOT_FOUND", "One or more products not found");
    }

    const productById = new Map(products.map((p) => [p.id, p]));
    for (const item of normalized) {
      const product = productById.get(item.productId);
      if (!product) throw new OrderError("PRODUCT_NOT_FOUND", "Product not found");
      if (!product.isActive) throw new OrderError("PRODUCT_INACTIVE", "Product is inactive");
    }

    const total = normalized.reduce((sum, item) => {
      const product = productById.get(item.productId)!;
      return sum + product.price * item.quantity;
    }, 0);

    const order = await tx.order.create({
      data: {
        userId,
        total,
        status: "PENDING",
        items: {
          create: normalized.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: productById.get(item.productId)!.price,
          })),
        },
      },
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
    });

    for (const item of normalized) {
      const updated = await tx.product.updateMany({
        where: { id: item.productId, stock: { gte: item.quantity }, isActive: true },
        data: { stock: { decrement: item.quantity } },
      });

      if (updated.count !== 1) {
        throw new OrderError("INSUFFICIENT_STOCK", "Insufficient stock");
      }

      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          orderId: order.id,
          type: "OUT",
          quantity: item.quantity,
          note: `Order ${order.id}`,
        },
      });
    }

    return order;
  });
}

export async function createOrderFromCart(userId: string) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    select: {
      id: true,
      items: { select: { productId: true, quantity: true } },
    },
  });

  if (!cart || cart.items.length === 0) throw new OrderError("CART_EMPTY", "Cart is empty");

  const order = await createOrder(userId, cart.items);

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

  return order;
}

export async function listOrders(userId: string) {
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      total: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return { orders };
}

export async function listAllOrders() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      total: true,
      createdAt: true,
      updatedAt: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return { orders };
}

export async function getOrder(orderId: string, requester: { id: string; role: Role }) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      total: true,
      createdAt: true,
      updatedAt: true,
      userId: true,
      items: {
        select: {
          id: true,
          quantity: true,
          unitPrice: true,
          product: { select: { id: true, sku: true, name: true } },
        },
      },
      payments: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          provider: true,
          amount: true,
          status: true,
          token: true,
          redirectUrl: true,
          transactionId: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!order) throw new OrderError("ORDER_NOT_FOUND", "Order not found");

  const isPrivileged = requester.role === "ADMIN" || requester.role === "BACKOFFICE";
  if (!isPrivileged && order.userId !== requester.id) throw new OrderError("FORBIDDEN", "Forbidden");

  const { userId: _userId, ...rest } = order;
  return { order: rest };
}
