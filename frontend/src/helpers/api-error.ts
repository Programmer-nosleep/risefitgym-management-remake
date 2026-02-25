import axios from "axios"

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return "Tidak bisa terhubung ke server. Pastikan backend berjalan dan URL API/CORS sudah benar."
    }

    const data = error.response?.data as unknown

    if (typeof data === "string" && data.trim() !== "") {
      return data
    }

    if (data && typeof data === "object") {
      const maybeError = (data as { error?: unknown }).error
      if (typeof maybeError === "string" && maybeError.trim() !== "") return maybeError
    }
  }

  return "Terjadi kesalahan. Silakan coba lagi."
}

