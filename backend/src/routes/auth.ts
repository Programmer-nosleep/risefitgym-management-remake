import { Elysia } from "elysia";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  loginController,
  registerController,
  signInController,
  signUpController,
} from "../modules/auth/auth.controller";
import { signInBodySchema, signUpBodySchema } from "../modules/auth/auth.schema";

export const authRoutes = new Elysia({ prefix: "/auth" })
  .use(authMiddleware)
  .post("/register", registerController, {
    body: signUpBodySchema,
  })
  .post("/signup", signUpController, {
    body: signUpBodySchema,
  })
  .post("/login", loginController, {
    body: signInBodySchema,
  })
  .post("/signin", signInController, {
    body: signInBodySchema,
  })
  .post("/signout", () => ({ ok: true }))
  .get("/me", ({ authUser, set }) => {
    if (!authUser) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    return { user: authUser };
  });
