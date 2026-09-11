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
