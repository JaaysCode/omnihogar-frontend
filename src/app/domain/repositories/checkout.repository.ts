import { Observable } from 'rxjs';
import { CheckoutAddressInput, CheckoutPreference, CheckoutStatus, PaymentMethodPreference } from '../models/checkout.model';

/**
 * Domain-facing contract for checkout (HU-08 dirección + método de pago, HU-09 pago vía
 * Mercado Pago). The presentation layer depends on this abstract class, never on the concrete
 * HTTP implementation in `data/`.
 */
export abstract class CheckoutRepository {
  /** Turns the active cart into an order and starts a Mercado Pago payment. */
  abstract createPreference(
    address: CheckoutAddressInput,
    paymentMethod: PaymentMethodPreference,
  ): Observable<CheckoutPreference>;

  /** Starts a new payment attempt for an order stuck at pending/rejected — no new order, no cart change. */
  abstract retry(orderId: string): Observable<CheckoutPreference>;

  /** Current order/payment status; verifies against Mercado Pago first when `paymentId` is given. */
  abstract getStatus(orderId: string, paymentId?: string): Observable<CheckoutStatus>;
}
