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

/** Normalized error thrown by the order data layer. */
export class OrderApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OrderApiError';
  }
}
