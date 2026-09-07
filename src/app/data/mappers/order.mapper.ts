import { HttpErrorResponse } from '@angular/common/http';
import { OrderApiError, OrderChannel, OrderDetail, OrderItemLine, OrderStatus, OrderSummary } from '../../domain/models/order.model';
import { OrderDetailDto, OrderItemDto, OrderSummaryDto } from '../services/order-api.dto';

const CHANNELS: readonly OrderChannel[] = ['web', 'store', 'chat'];
const STATUSES: readonly OrderStatus[] = [
  'pending_payment',
  'payment_approved',
  'preparing',
  'packed',
  'shipped',
  'delivered',
  'cancelled',
  'payment_rejected',
];

function toChannel(value: string): OrderChannel {
  return (CHANNELS as readonly string[]).includes(value) ? (value as OrderChannel) : 'web';
}

function toStatus(value: string): OrderStatus {
  return (STATUSES as readonly string[]).includes(value) ? (value as OrderStatus) : 'pending_payment';
}

export function toOrderSummary(dto: OrderSummaryDto): OrderSummary {
  return {
    id: dto.id,
    orderNumber: dto.orderNumber,
    channel: toChannel(dto.channel),
    status: toStatus(dto.status),
    total: dto.total,
    createdAt: dto.createdAt,
    customerName: dto.customerName,
    itemCount: dto.itemCount,
  };
}

function toOrderItemLine(dto: OrderItemDto): OrderItemLine {
  return {
    productId: dto.productId,
    productName: dto.productName,
    sku: dto.sku,
    quantity: dto.quantity,
    unitPrice: dto.unitPrice,
    subtotal: dto.subtotal,
  };
}

export function toOrderDetail(dto: OrderDetailDto): OrderDetail {
  return {
    id: dto.id,
    orderNumber: dto.orderNumber,
    channel: toChannel(dto.channel),
    status: toStatus(dto.status),
    subtotal: dto.subtotal,
    total: dto.total,
    createdAt: dto.createdAt,
    customerName: dto.customerName,
    customerEmail: dto.customerEmail,
    items: dto.items.map(toOrderItemLine),
  };
}

/** Translates a failed HTTP call into a domain-level {@link OrderApiError}. */
export function toOrderApiError(error: unknown): OrderApiError {
  if (!(error instanceof HttpErrorResponse)) {
    return new OrderApiError($localize`:@@orders.error.generic:Ocurrió un error inesperado. Inténtalo de nuevo.`);
  }

  if (error.status === 401 || error.status === 403) {
    return new OrderApiError($localize`:@@orders.error.forbidden:No tienes permisos para consultar pedidos.`);
  }

  if (error.status === 404) {
    return new OrderApiError($localize`:@@orders.error.notFound:El pedido no existe.`);
  }

  if (error.status === 0) {
    return new OrderApiError(
      $localize`:@@orders.error.offline:No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.`,
    );
  }

  return new OrderApiError($localize`:@@orders.error.generic:Ocurrió un error inesperado. Inténtalo de nuevo.`);
}
