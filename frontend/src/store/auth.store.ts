import type { Role } from "@/route/app-nav"
import { create } from "zustand"
import { persist } from "zustand/middleware"

export type AuthUser = {
  id: string
  name: string
  email: string
  role: Role
}

type AuthState = {
  accessToken: string | null
  user: AuthUser | null
  setAuth: (payload: { accessToken: string; user: AuthUser }) => void
  setUser: (user: AuthUser | null) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      setAuth: ({ accessToken, user }) => set({ accessToken, user }),
      setUser: (user) => set({ user }),
      clearAuth: () => set({ accessToken: null, user: null }),
    }),
    { name: "risefit-auth" }
  )
)
