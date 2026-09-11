import { Observable } from 'rxjs';
import { OrderDetail, OrderSummary, StoreSaleItem, StoreSaleReceipt } from '../models/order.model';

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
  /**
   * Register a walk-in sale at the register (HU-06 — POS "Finalizar Venta"). Rejects with a
   * field error under `items` when a line exceeds the available stock.
   */
  abstract registerStoreSale(items: StoreSaleItem[]): Observable<StoreSaleReceipt>;
}
