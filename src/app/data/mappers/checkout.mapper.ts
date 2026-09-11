import { HttpErrorResponse } from '@angular/common/http';
import {
  CheckoutApiError,
  CheckoutFieldErrors,
  CheckoutPreference,
  CheckoutStatus,
  PaymentStatus,
} from '../../domain/models/checkout.model';
import { OrderStatus } from '../../domain/models/order.model';
import { ApiProblemDto } from '../services/auth-api.dto';
import { CheckoutDto, CheckoutStatusDto } from '../services/checkout-api.dto';

const ORDER_STATUSES: readonly OrderStatus[] = [
  'pending_payment',
  'payment_approved',
  'preparing',
  'packed',
  'shipped',
  'delivered',
  'cancelled',
  'payment_rejected',
];

const PAYMENT_STATUSES: readonly PaymentStatus[] = ['pending', 'approved', 'rejected', 'reversed'];

function toOrderStatus(value: string): OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value) ? (value as OrderStatus) : 'pending_payment';
}

function toPaymentStatus(value: string): PaymentStatus {
  return (PAYMENT_STATUSES as readonly string[]).includes(value) ? (value as PaymentStatus) : 'pending';
}

export function toCheckoutPreference(dto: CheckoutDto): CheckoutPreference {
  return { orderId: dto.orderId, orderNumber: dto.orderNumber, initPoint: dto.initPoint };
}

export function toCheckoutStatus(dto: CheckoutStatusDto): CheckoutStatus {
  return {
    orderId: dto.orderId,
    orderNumber: dto.orderNumber,
    orderStatus: toOrderStatus(dto.orderStatus),
    paymentStatus: toPaymentStatus(dto.paymentStatus),
    total: dto.total,
    gatewayUnavailable: dto.gatewayUnavailable,
  };
}

/**
 * Lowercases the backend's field-error keys down to what the checkout form actually uses.
 * FluentValidation reports nested properties dotted (e.g. "Address.Address", "Address.City");
 * this keeps only the last segment — "address", "city" — matching the flat reactive-form
 * control names. Top-level keys ("PaymentMethod", "Cart", "Gateway") just get their first
 * letter lowercased ("paymentMethod", "cart", "gateway").
 */
function toFieldErrors(errors: Record<string, string[]>): CheckoutFieldErrors {
  const normalized: CheckoutFieldErrors = {};
  for (const [key, messages] of Object.entries(errors)) {
    const lastSegment = key.split('.').pop() ?? key;
    const fieldName = lastSegment.charAt(0).toLowerCase() + lastSegment.slice(1);
    normalized[fieldName] = messages;
  }
  return normalized;
}

/** Translates a failed HTTP call into a domain-level {@link CheckoutApiError}. */
export function toCheckoutApiError(error: unknown): CheckoutApiError {
  const generic = $localize`:@@checkout.error.generic:Ocurrió un error inesperado. Inténtalo de nuevo.`;

  if (!(error instanceof HttpErrorResponse)) {
    return new CheckoutApiError(generic);
  }

  if (error.status === 400) {
    const problem = error.error as ApiProblemDto | null;
    const fieldErrors = problem?.errors ? toFieldErrors(problem.errors) : undefined;
    return new CheckoutApiError(
      fieldErrors
        ? (Object.values(fieldErrors)[0]?.[0] ?? $localize`:@@checkout.error.validation:Revisa los datos e inténtalo de nuevo.`)
        : (problem?.title ?? $localize`:@@checkout.error.validation:Revisa los datos e inténtalo de nuevo.`),
      fieldErrors,
    );
  }

  if (error.status === 401) {
    return new CheckoutApiError($localize`:@@checkout.error.unauthorized:Inicia sesión para continuar con tu compra.`);
  }

  if (error.status === 403) {
    return new CheckoutApiError($localize`:@@checkout.error.forbidden:No puedes continuar esta compra con esta cuenta.`);
  }

  if (error.status === 404) {
    return new CheckoutApiError($localize`:@@checkout.error.notFound:El pedido no existe.`);
  }

  if (error.status === 0) {
    return new CheckoutApiError(
      $localize`:@@checkout.error.offline:No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.`,
    );
  }

  return new CheckoutApiError(generic);
}
