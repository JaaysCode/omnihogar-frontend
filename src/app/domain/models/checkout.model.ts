import { OrderStatus } from './order.model';

/** Delivery address entered at checkout (HU-08 crit. 1). */
export interface CheckoutAddressInput {
  address: string;
  city: string;
  neighborhood: string | null;
  reference: string | null;
}

/** Matches the values `Payment.PaymentMethod` already accepts on the backend. */
export type PaymentMethodPreference = 'card' | 'pse' | 'wallet';

/** Response of starting (or retrying) a Mercado Pago Checkout Pro payment. */
export interface CheckoutPreference {
  orderId: string;
  orderNumber: string;
  /** Mercado Pago's hosted checkout URL — redirect the whole page here, not a router link. */
  initPoint: string;
}

export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'reversed';

/** Current state of an order's payment, for the /checkout/result page (HU-09). */
export interface CheckoutStatus {
  orderId: string;
  orderNumber: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  total: number;
  /** True when the last check against Mercado Pago failed — the order is preserved (HU-09
   * crit. 3); the UI should offer to refresh the status or retry the payment. */
  gatewayUnavailable: boolean;
}

/** Per-field validation messages, keyed by camelCase field name (e.g. "address.address"). */
export type CheckoutFieldErrors = Record<string, string[]>;

/**
 * Normalized error thrown by the checkout data layer. `fieldErrors` is populated for 400
 * (missing data / insufficient stock / gateway communication error) responses.
 */
export class CheckoutApiError extends Error {
  constructor(
    message: string,
    readonly fieldErrors?: CheckoutFieldErrors,
  ) {
    super(message);
    this.name = 'CheckoutApiError';
  }
}
