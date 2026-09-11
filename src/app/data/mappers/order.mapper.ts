import { HttpErrorResponse } from '@angular/common/http';
import {
  OrderApiError,
  OrderChannel,
  OrderDetail,
  OrderFieldErrors,
  OrderItemLine,
  OrderStatus,
  OrderSummary,
  StoreSaleReceipt,
} from '../../domain/models/order.model';
import { ApiProblemDto } from '../services/auth-api.dto';
import { OrderDetailDto, OrderItemDto, OrderSummaryDto, StoreSaleReceiptDto } from '../services/order-api.dto';

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

export function toStoreSaleReceipt(dto: StoreSaleReceiptDto): StoreSaleReceipt {
  return {
    orderId: dto.orderId,
    orderNumber: dto.orderNumber,
    subtotal: dto.subtotal,
    tax: dto.tax,
    total: dto.total,
    createdAt: dto.createdAt,
  };
}

/** Lowercases the backend's PascalCase field-error keys (e.g. "Items" -> "items"). */
function toFieldErrors(errors: Record<string, string[]>): OrderFieldErrors {
  const normalized: OrderFieldErrors = {};
  for (const [key, messages] of Object.entries(errors)) {
    const fieldName = key.charAt(0).toLowerCase() + key.slice(1);
    normalized[fieldName] = messages;
  }
  return normalized;
}

/** Translates a failed HTTP call into a domain-level {@link OrderApiError}. */
export function toOrderApiError(error: unknown): OrderApiError {
  if (!(error instanceof HttpErrorResponse)) {
    return new OrderApiError($localize`:@@orders.error.generic:Ocurrió un error inesperado. Inténtalo de nuevo.`);
  }

  if (error.status === 400) {
    const problem = error.error as ApiProblemDto | null;
    const fieldErrors = problem?.errors ? toFieldErrors(problem.errors) : undefined;
    return new OrderApiError(
      fieldErrors
        ? Object.values(fieldErrors)[0]?.[0] ?? $localize`:@@orders.error.validation:Revisa los datos e inténtalo de nuevo.`
        : problem?.title ?? $localize`:@@orders.error.validation:Revisa los datos e inténtalo de nuevo.`,
      fieldErrors,
    );
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
