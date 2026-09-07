import { Observable } from 'rxjs';
import { OrderDetail, OrderSummary } from '../models/order.model';

/**
 * Domain-facing contract for cross-channel order consultation. The presentation layer depends
 * on this abstract class (Angular's DI token pattern), never on the concrete HTTP implementation
 * in `data/`.
 */
export abstract class OrderRepository {
  /** Every registered order, across channels — newest first. */
  abstract getAll(): Observable<OrderSummary[]>;
  /** Full detail (products, quantities, value, client, channel, status) for one order. 404s
   * when the id isn't registered — surfaced by the caller as OrderApiError. */
  abstract getById(id: string): Observable<OrderDetail>;
}
