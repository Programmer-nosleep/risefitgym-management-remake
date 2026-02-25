import type { Role } from "@/route/app-nav"
import { get, patch, post } from "@/lib/http"
import type { Attendance, AttendanceUser, MidtransTokenResponse, OrderStatus, Product, UserProfile } from "./user"

type IsoDateString = string

export async function listUsers() {
  const { users } = await get<{ users: UserProfile[] }>("/users")
  return users
}

export async function getUserById(userId: string) {
  const { user } = await get<{ user: UserProfile }>(`/users/${userId}`)
  return user
}

export async function setUserRole(userId: string, role: Role) {
  const { user } = await patch<{ user: UserProfile }, { role: Role }>(`/users/${userId}/role`, { role })
  return user
}

export async function createProduct(input: {
  sku: string
  name: string
  description?: string
  price: number
  stock?: number
  isActive?: boolean
}) {
  const { product } = await post<{ product: Product }, typeof input>("/products", input)
  return product
}

export async function updateProduct(
  productId: string,
  input: {
    sku?: string
    name?: string
    description?: string
    price?: number
    isActive?: boolean
  }
) {
  const { product } = await patch<{ product: Product }, typeof input>(`/products/${productId}`, input)
  return product
}

export async function stockInProduct(input: { productId: string; quantity: number; agentId?: string; note?: string }) {
  const { product } = await post<{ product: Pick<Product, "id" | "sku" | "name" | "price" | "stock" | "isActive" | "updatedAt"> }, Omit<typeof input, "productId">>(
    `/products/${input.productId}/stock/in`,
    { quantity: input.quantity, agentId: input.agentId, note: input.note }
  )
  return product
}

export async function adjustProductStock(input: { productId: string; quantityDelta: number; note?: string }) {
  const { product } = await post<{ product: Pick<Product, "id" | "sku" | "name" | "price" | "stock" | "isActive" | "updatedAt"> }, Omit<typeof input, "productId">>(
    `/products/${input.productId}/stock/adjust`,
    { quantityDelta: input.quantityDelta, note: input.note }
  )
  return product
}

export type ProductMovement = {
  id: string
  type: "IN" | "OUT" | "ADJUST"
  quantity: number
  note: string | null
  createdAt: IsoDateString
  agent: { id: string; name: string } | null
  order: { id: string; status: OrderStatus } | null
}

export async function listProductMovements(productId: string) {
  const { movements } = await get<{ movements: ProductMovement[] }>(`/products/${productId}/movements`)
  return movements
}

export type Agent = {
  id: string
  name: string
  email: string | null
  phone: string | null
  createdAt: IsoDateString
  updatedAt: IsoDateString
}

export async function listAgents() {
  const { agents } = await get<{ agents: Agent[] }>("/agents")
  return agents
}

export async function createAgent(input: { name: string; email?: string; phone?: string }) {
  const { agent } = await post<{ agent: Agent }, typeof input>("/agents", input)
  return agent
}

export type AgentMovement = {
  id: string
  type: "IN" | "OUT" | "ADJUST"
  quantity: number
  note: string | null
  createdAt: IsoDateString
  product: { id: string; sku: string; name: string }
}

export async function listAgentMovements(agentId: string) {
  const { movements } = await get<{ movements: AgentMovement[] }>(`/agents/${agentId}/movements`)
  return movements
}

export async function listAttendances() {
  const { attendances } = await get<{ attendances: (Attendance & { user: AttendanceUser })[] }>("/attendance")
  return attendances
}

export async function scanAttendance(input: {
  qrData: string
  action?: "TOGGLE" | "CHECK_IN" | "CHECK_OUT"
  latitude?: number
  longitude?: number
  locationText?: string
}) {
  return await post<
    { attendance: Attendance & { user: AttendanceUser }; distanceMeters: number | null },
    typeof input
  >("/attendance/scan", input)
}

export type OrderSummaryAdmin = {
  id: string
  status: OrderStatus
  total: number
  createdAt: IsoDateString
  updatedAt: IsoDateString
  user: { id: string; name: string; email: string }
}

export async function listAllOrders() {
  const { orders } = await get<{ orders: OrderSummaryAdmin[] }>("/orders/all")
  return orders
}

export async function checkoutOrder(orderId: string) {
  return await post<MidtransTokenResponse>(`/orders/${orderId}/checkout`)
}
