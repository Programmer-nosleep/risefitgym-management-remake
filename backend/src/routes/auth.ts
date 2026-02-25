import { Elysia, t } from "elysia";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  loginController,
  registerController,
  signInController,
  signUpController,
} from "../modules/auth/auth.controller";
import { googleOauthCallbackController, googleOauthStartController } from "../modules/auth/oauth.controller";
import { otpRequestController, otpVerifyController } from "../modules/auth/otp.controller";
import {
  otpRequestBodySchema,
  otpVerifyBodySchema,
  signInBodySchema,
  signUpBodySchema,
} from "../modules/auth/auth.schema";

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
  .post("/otp/request", otpRequestController, {
    body: otpRequestBodySchema,
  })
  .post("/otp/verify", otpVerifyController, {
    body: otpVerifyBodySchema,
  })
  .get("/oauth/google", googleOauthStartController, {
    query: t.Object({ next: t.Optional(t.String()) }),
  })
  .get("/oauth/google/callback", googleOauthCallbackController, {
    query: t.Object({
      code: t.Optional(t.String()),
      state: t.Optional(t.String()),
      error: t.Optional(t.String()),
    }),
  })
  .post("/signout", () => ({ ok: true }))
  .get("/me", ({ authUser, set }) => {
    if (!authUser) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    return { user: authUser };
  });
