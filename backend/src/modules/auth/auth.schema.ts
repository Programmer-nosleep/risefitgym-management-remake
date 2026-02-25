import { t } from "elysia";

export const signUpBodySchema = t.Object({
  name: t.String({ minLength: 1 }),
  email: t.String({ format: "email" }),
  password: t.String({ minLength: 8 }),
  role: t.Optional(t.Union([t.Literal("USER"), t.Literal("ADMIN"), t.Literal("BACKOFFICE")])),
});

export const signInBodySchema = t.Object({
  email: t.String({ format: "email" }),
  password: t.String({ minLength: 1 }),
});

export const otpPurposeSchema = t.Union([
  t.Literal("LOGIN"),
  t.Literal("REGISTER"),
  t.Literal("VERIFY_EMAIL"),
]);

export const otpRequestBodySchema = t.Object({
  email: t.String({ format: "email" }),
  purpose: otpPurposeSchema,
  name: t.Optional(t.String({ minLength: 1 })),
});

export const otpVerifyBodySchema = t.Object({
  email: t.String({ format: "email" }),
  purpose: otpPurposeSchema,
  code: t.String({ pattern: "^[0-9]{6}$" }),
});
