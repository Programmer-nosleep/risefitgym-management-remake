import type { Context } from "elysia";
import { AuthError, loginUser, registerUser } from "./auth.service";

type ElysiaSet = Context["set"];

export async function signUpController({
  body,
  set,
}: {
  body: { name: string; email: string; password: string; role?: "USER" | "ADMIN" | "BACKOFFICE" };
  set: ElysiaSet;
}) {
  try {
    return await registerUser(body);
  } catch (error) {
    if (error instanceof AuthError) {
      set.status = error.code === "EMAIL_EXISTS" ? 409 : 400;
      return { error: error.message };
    }

    set.status = 500;
    return { error: "Internal Server Error" };
  }
}

export const registerController = signUpController;

export async function signInController({
  body,
  set,
}: {
  body: { email: string; password: string };
  set: ElysiaSet;
}) {
  try {
    return await loginUser(body);
  } catch (error) {
    if (error instanceof AuthError) {
      set.status = 401;
      return { error: error.message };
    }

    set.status = 500;
    return { error: "Internal Server Error" };
  }
}

export const loginController = signInController;
