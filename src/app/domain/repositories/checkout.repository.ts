import { Observable } from 'rxjs';
import { CheckoutAddressInput, CheckoutPreference, CheckoutStatus, PaymentMethodPreference } from '../models/checkout.model';

/**
 * Domain-facing contract for checkout (HU-08 dirección + método de pago, HU-09 pago vía
 * Stripe Checkout). The presentation layer depends on this abstract class, never on the concrete
 * HTTP implementation in `data/`.
 */
export abstract class CheckoutRepository {
  /** Turns the active cart into an order and starts a Stripe Checkout payment. */
  abstract createPreference(
    address: CheckoutAddressInput,
    paymentMethod: PaymentMethodPreference,
  ): Observable<CheckoutPreference>;

  /** Starts a new payment attempt for an order stuck at pending/rejected — no new order, no cart change. */
  abstract retry(orderId: string): Observable<CheckoutPreference>;

  /** Current order/payment status; verifies against Stripe first when `paymentId` is given.
   * `cancelled` marks the payment rejected outright — set it when the buyer bailed out of
   * Stripe's hosted page instead of paying, since Stripe itself would still report it pending. */
  abstract getStatus(orderId: string, paymentId?: string, cancelled?: boolean): Observable<CheckoutStatus>;
}
