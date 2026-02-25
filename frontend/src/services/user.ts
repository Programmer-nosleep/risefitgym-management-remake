import type { Role } from "@/route/app-nav"
import { del, get, patch, post } from "@/lib/http"

type IsoDateString = string

export type UserProfile = {
  id: string
  name: string
  email: string
  role: Role
  createdAt: IsoDateString
  updatedAt: IsoDateString
}

export async function getMyProfile() {
  const { user } = await get<{ user: UserProfile }>("/users/me")
  return user
}

export async function updateMyProfile(input: {
  name?: string
  currentPassword?: string
  newPassword?: string
}) {
  const { user } = await patch<{ user: UserProfile }, typeof input>("/users/me", input)
  return user
}

export type Membership = {
  id: string
  name: string
  description: string
  price: number
  durationDays: number
  createdAt: IsoDateString
  updatedAt: IsoDateString
}

export type ActiveMembership = {
  id: string
  startDate: IsoDateString
  endDate: IsoDateString
  status: "ACTIVE" | "EXPIRED" | "CANCELLED"
  membership: Pick<Membership, "id" | "name" | "description" | "price" | "durationDays">
}

export async function listMemberships() {
  const { memberships } = await get<{ memberships: Membership[] }>("/memberships")
  return memberships
}

export async function getMyActiveMembership() {
  const { activeMembership } = await get<{ activeMembership: ActiveMembership | null }>("/memberships/me")
  return activeMembership
}

export async function subscribeMembership(membershipId: string) {
  const { userMembership } = await post<{ userMembership: ActiveMembership }, { membershipId: string }>(
    "/memberships/subscribe",
    { membershipId }
  )
  return userMembership
}

export type Product = {
  id: string
  sku: string
  name: string
  description: string | null
  price: number
  stock: number
  isActive: boolean
  createdAt: IsoDateString
  updatedAt: IsoDateString
}

export async function listProducts() {
  const { products } = await get<{ products: Product[] }>("/products")
  return products
}

export async function getProduct(productId: string) {
  const { product } = await get<{ product: Product }>(`/products/${productId}`)
  return product
}

export type CartItem = {
  id: string
  quantity: number
  product: Pick<
    Product,
    "id" | "sku" | "name" | "description" | "price" | "stock" | "isActive"
  >
}

export type Cart = {
  id: string
  userId: string
  items: CartItem[]
}

export async function getCart() {
  return await get<{ cart: Cart; total: number }>("/cart")
}

export async function addCartItem(input: { productId: string; quantity: number }) {
  return await post<{ cart: Cart; total: number }, typeof input>("/cart/items", input)
}

export async function updateCartItem(input: { itemId: string; quantity: number }) {
  return await patch<{ cart: Cart; total: number }, { quantity: number }>(
    `/cart/items/${input.itemId}`,
    { quantity: input.quantity }
  )
}

export async function removeCartItem(itemId: string) {
  return await del<{ cart: Cart; total: number }>(`/cart/items/${itemId}`)
}

export type OrderStatus = "PENDING" | "PAID" | "COMPLETED" | "CANCELLED" | "EXPIRED"
export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED"

export type OrderSummary = {
  id: string
  status: OrderStatus
  total: number
  createdAt: IsoDateString
  updatedAt: IsoDateString
}

export type OrderItem = {
  id: string
  quantity: number
  unitPrice: number
  product: { id: string; sku: string; name: string }
}

export type OrderPayment = {
  id: string
  provider: "MIDTRANS"
  amount: number
  status: PaymentStatus
  token: string | null
  redirectUrl: string | null
  transactionId: string | null
  createdAt: IsoDateString
  updatedAt: IsoDateString
}

export type OrderCreated = OrderSummary & {
  items: OrderItem[]
}

export type OrderDetail = OrderSummary & {
  items: OrderItem[]
  payments: OrderPayment[]
}

export async function listMyOrders() {
  const { orders } = await get<{ orders: OrderSummary[] }>("/orders")
  return orders
}

export async function getOrder(orderId: string) {
  const { order } = await get<{ order: OrderDetail }>(`/orders/${orderId}`)
  return order
}

export async function createOrder(input: { items: { productId: string; quantity: number }[] }) {
  const { order } = await post<{ order: OrderCreated }, typeof input>("/orders", input)
  return order
}

export async function createOrderFromCart() {
  const { order } = await post<{ order: OrderCreated }>("/orders/from-cart")
  return order
}

export type MidtransTokenResponse = {
  paymentId: string
  token: string
  redirectUrl: string
  qrData: string
}

export async function checkoutOrder(orderId: string) {
  return await post<MidtransTokenResponse>(`/orders/${orderId}/checkout`)
}

export async function createPaymentToken(orderId: string) {
  return await post<MidtransTokenResponse, { orderId: string }>("/payment/token", { orderId })
}

export type InvoiceStatus = "PENDING" | "PAID" | "FAILED" | "CANCELLED"

export type Invoice = {
  id: string
  orderId: string
  userId: string
  amount: number
  paymentMethod: string
  status: InvoiceStatus
  transactionId: string
  createdAt: IsoDateString
  updatedAt: IsoDateString
  order: {
    id: string
    status: OrderStatus
    total: number
    createdAt: IsoDateString
    updatedAt: IsoDateString
    items: {
      id: string
      quantity: number
      unitPrice: number
      product: { id: string; sku: string; name: string }
    }[]
  }
  user: { id: string; name: string; email: string }
}

export async function createInvoice(orderId: string) {
  const { invoice } = await post<{ invoice: Invoice }, { orderId: string }>("/invoices", { orderId })
  return invoice
}

export async function getInvoice(invoiceId: string) {
  const { invoice } = await get<{ invoice: Invoice }>(`/invoices/${invoiceId}`)
  return invoice
}

export async function getInvoiceByOrder(orderId: string) {
  const { invoice } = await get<{ invoice: Invoice }>(`/invoices/order/${orderId}`)
  return invoice
}

export type AttendanceUser = {
  id: string
  name: string
  email: string
  role: Role
}

export type Attendance = {
  id: string
  checkInAt: IsoDateString
  checkOutAt: IsoDateString | null
  latitude: number | null
  longitude: number | null
  locationText: string | null
  createdAt: IsoDateString
  updatedAt: IsoDateString
  scannedByUser: AttendanceUser | null
}

export async function listMyAttendances() {
  const { attendances } = await get<{ attendances: Attendance[] }>("/attendance/me")
  return attendances
}

export async function getAttendanceQr() {
  return await get<{
    qrData: string
    expiresAt: IsoDateString
    user: AttendanceUser
  }>("/attendance/qr")
}

export type ProfileDashboard = {
  user: UserProfile
  activeMembership: ActiveMembership | null
  lastAttendanceAt: IsoDateString | null
  stats: {
    ordersCount: number
    paidOrdersCount: number
    totalSpent: number
    attendancesCount: number
  }
  recentOrders: { id: string; status: OrderStatus; total: number; createdAt: IsoDateString }[]
  recentAttendances: {
    id: string
    checkInAt: IsoDateString
    checkOutAt: IsoDateString | null
    createdAt: IsoDateString
  }[]
}

export async function getMyProfileDashboard() {
  const { profile } = await get<{ profile: ProfileDashboard }>("/profile/me")
  return profile
}
