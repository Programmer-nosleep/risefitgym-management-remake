import axios from "axios"

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as unknown

    if (data && typeof data === "object") {
      const maybeError = (data as { error?: unknown }).error
      if (typeof maybeError === "string" && maybeError.trim() !== "") return maybeError
    }
  }

  return "Terjadi kesalahan. Silakan coba lagi."
}

