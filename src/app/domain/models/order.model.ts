export type OrderChannel = 'web' | 'store' | 'chat';

export type OrderStatus =
  | 'pending_payment'
  | 'payment_approved'
  | 'preparing'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'payment_rejected';

/** Row shape for the cross-channel order consultation list (HU consulta de pedidos). */
export interface OrderSummary {
  id: string;
  orderNumber: string;
  channel: OrderChannel;
  status: OrderStatus;
  total: number;
  createdAt: string;
  customerName: string;
  itemCount: number;
}

/** One product line within an order's detail view. */
export interface OrderItemLine {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

/** Full detail of a single order — products, quantities, value, client, channel and status. */
export interface OrderDetail {
  id: string;
  orderNumber: string;
  channel: OrderChannel;
  status: OrderStatus;
  subtotal: number;
  total: number;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  items: OrderItemLine[];
}

/** Body for advancing an order's status (HU-14 crit. 1). `comment` is optional context for the audit trail. */
export interface UpdateOrderStatusPayload {
  status: OrderStatus;
  comment?: string;
}

/** One product/quantity pair on a store-sale request (HU-06). */
export interface StoreSaleItem {
  productId: string;
  quantity: number;
}

/** Receipt returned after successfully registering an in-store sale (HU-06). */
export interface StoreSaleReceipt {
  orderId: string;
  orderNumber: string;
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
}

/** Per-field validation messages, keyed by camelCase field name (e.g. "items"). */
export type OrderFieldErrors = Record<string, string[]>;

/**
 * Normalized error thrown by the order data layer. `fieldErrors` is populated for 400
 * (validation / insufficient stock) responses from registering a sale; absent otherwise.
 */
export class OrderApiError extends Error {
  constructor(
    message: string,
    readonly fieldErrors?: OrderFieldErrors,
  ) {
    super(message);
    this.name = 'OrderApiError';
  }
}

/** Human-readable channel label — shared by every page/component that renders an order's channel. */
export const ORDER_CHANNEL_LABELS: Record<OrderChannel, string> = {
  web: $localize`:@@orders.channel.web:Web`,
  store: $localize`:@@orders.channel.store:Tienda`,
  chat: $localize`:@@orders.channel.chat:Chat`,
};

/** Human-readable status label — shared by every page/component that renders an order's status. */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: $localize`:@@orders.status.pendingPayment:Pago pendiente`,
  payment_approved: $localize`:@@orders.status.paymentApproved:Pago aprobado`,
  preparing: $localize`:@@orders.status.preparing:Preparando`,
  packed: $localize`:@@orders.status.packed:Empacado`,
  shipped: $localize`:@@orders.status.shipped:Enviado`,
  delivered: $localize`:@@orders.status.delivered:Entregado`,
  cancelled: $localize`:@@orders.status.cancelled:Cancelado`,
  payment_rejected: $localize`:@@orders.status.paymentRejected:Pago rechazado`,
};

/** Visual tone per status — matches the pill classes used across the admin panel and customer pages. */
export const ORDER_STATUS_TONES: Record<OrderStatus, 'positive' | 'neutral' | 'warning' | 'negative'> = {
  pending_payment: 'warning',
  payment_approved: 'neutral',
  preparing: 'neutral',
  packed: 'neutral',
  shipped: 'neutral',
  delivered: 'positive',
  cancelled: 'negative',
  payment_rejected: 'negative',
};

/** All order statuses, in the order shown in status-change dropdowns. */
export const ORDER_STATUSES: readonly OrderStatus[] = [
  'pending_payment',
  'payment_approved',
  'preparing',
  'packed',
  'shipped',
  'delivered',
  'cancelled',
  'payment_rejected',
];
