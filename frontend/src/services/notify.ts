import { getApiErrorMessage } from "@/helpers/api-error"

export function notifyError(error: unknown, options?: { prefix?: string }) {
  const message = getApiErrorMessage(error)
  const prefix = options?.prefix ? `${options.prefix}: ` : ""
  console.error(prefix + message, error)
  return prefix + message
}
