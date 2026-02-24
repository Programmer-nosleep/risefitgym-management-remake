import type { Context } from "elysia";
import type { Role } from "@prisma/client";
import { InvoiceError, createInvoiceForOrder, getInvoice } from "./invoice.service";

type ElysiaSet = Context["set"];

function statusForInvoiceError(code: string) {
  switch (code) {
    case "ORDER_NOT_FOUND":
    case "INVOICE_NOT_FOUND":
      return 404;
    case "FORBIDDEN":
      return 403;
    case "ORDER_NOT_PAID":
    case "PAYMENT_NOT_FOUND":
      return 409;
    default:
      return 400;
  }
}

export async function createInvoiceController({
  authUser,
  body,
  set,
}: {
  authUser: { id: string; role: Role } | null;
  body: { orderId: string };
  set: ElysiaSet;
}) {
  if (!authUser) {
    set.status = 401;
    return { error: "Unauthorized" };
  }

  try {
    const result = await createInvoiceForOrder(body.orderId, authUser);
    if (result.created) set.status = 201;
    return { invoice: result.invoice };
  } catch (error) {
    if (error instanceof InvoiceError) {
      set.status = statusForInvoiceError(error.code);
      return { error: error.message };
    }

    set.status = 500;
    return { error: "Internal Server Error" };
  }
}

export async function invoiceByOrderController({
  authUser,
  params,
  set,
}: {
  authUser: { id: string; role: Role } | null;
  params: { orderId: string };
  set: ElysiaSet;
}) {
  if (!authUser) {
    set.status = 401;
    return { error: "Unauthorized" };
  }

  try {
    const result = await createInvoiceForOrder(params.orderId, authUser);
    return { invoice: result.invoice };
  } catch (error) {
    if (error instanceof InvoiceError) {
      set.status = statusForInvoiceError(error.code);
      return { error: error.message };
    }

    set.status = 500;
    return { error: "Internal Server Error" };
  }
}

export async function getInvoiceController({
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
    return await getInvoice(params.id, authUser);
  } catch (error) {
    if (error instanceof InvoiceError) {
      set.status = statusForInvoiceError(error.code);
      return { error: error.message };
    }

    set.status = 500;
    return { error: "Internal Server Error" };
  }
}
