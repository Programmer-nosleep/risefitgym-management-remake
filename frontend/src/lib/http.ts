import type { AxiosRequestConfig } from "axios"
import { api } from "@/lib/api"

export async function get<TResponse>(
  url: string,
  config?: AxiosRequestConfig
): Promise<TResponse> {
  const response = await api.get<TResponse>(url, config)
  return response.data
}

export async function post<TResponse, TBody = undefined>(
  url: string,
  body?: TBody,
  config?: AxiosRequestConfig
): Promise<TResponse> {
  const response = await api.post<TResponse>(url, body, config)
  return response.data
}

export async function patch<TResponse, TBody>(
  url: string,
  body: TBody,
  config?: AxiosRequestConfig
): Promise<TResponse> {
  const response = await api.patch<TResponse>(url, body, config)
  return response.data
}

export async function del<TResponse>(
  url: string,
  config?: AxiosRequestConfig
): Promise<TResponse> {
  const response = await api.delete<TResponse>(url, config)
  return response.data
}

