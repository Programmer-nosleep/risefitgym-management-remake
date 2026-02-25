import type { AuthUser } from "@/store/auth.store"
import { api } from "@/services/api"
import axios from "axios"

export type AuthSuccess = {
  user: AuthUser
  accessToken: string
}

export type OtpPurpose = "LOGIN" | "REGISTER" | "VERIFY_EMAIL"

export type OtpRequestResult = {
  ok: true
  purpose: OtpPurpose
  email: string
  expiresAt: string
}

export async function signIn(input: { email: string; password: string }) {
  try {
    const response = await api.post<AuthSuccess>("/auth/signin", input)
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      const response = await api.post<AuthSuccess>("/auth/login", input)
      return response.data
    }

    throw error
  }
}

export async function signUp(input: { name: string; email: string; password: string }) {
  try {
    const response = await api.post<AuthSuccess>("/auth/signup", input)
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      const response = await api.post<AuthSuccess>("/auth/register", input)
      return response.data
    }

    throw error
  }
}

export async function getMe() {
  const response = await api.get<{ user: AuthUser }>("/auth/me")
  return response.data.user
}

export async function requestOtp(input: { email: string; purpose: OtpPurpose; name?: string }) {
  const response = await api.post<OtpRequestResult>("/auth/otp/request", input)
  return response.data
}

export async function verifyOtp(input: { email: string; purpose: OtpPurpose; code: string }) {
  const response = await api.post<AuthSuccess>("/auth/otp/verify", input)
  return response.data
}
