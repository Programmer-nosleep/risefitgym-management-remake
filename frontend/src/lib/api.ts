import axios from "axios"
import { useAuthStore } from "@/store/auth.store"

export const apiBaseUrl =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:8000"

export const api = axios.create({
  baseURL: apiBaseUrl,
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (!token) return config

  config.headers = config.headers ?? {}
  config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      useAuthStore.getState().clearAuth()
    }

    return Promise.reject(error)
  }
)
