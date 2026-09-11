/** Wire-shape DTOs — mirror the backend's JSON exactly (camelCase via System.Text.Json). */

export interface OrderSummaryDto {
  id: string;
  orderNumber: string;
  channel: string;
  status: string;
  total: number;
  createdAt: string;
  customerName: string;
  itemCount: number;
}

export interface OrderItemDto {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface OrderDetailDto {
  id: string;
  orderNumber: string;
  channel: string;
  status: string;
  subtotal: number;
  total: number;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  items: OrderItemDto[];
}

/** Body for POST /orders (HU-06 — register a store sale). */
export interface RegisterStoreSaleRequestDto {
  items: { productId: string; quantity: number }[];
}

export interface StoreSaleReceiptDto {
  orderId: string;
  orderNumber: string;
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
}
