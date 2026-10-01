import { Observable } from 'rxjs';
import {
  OrderDetail,
  OrderSummary,
  StoreSaleItem,
  StoreSaleReceipt,
  UpdateOrderStatusPayload,
} from '../models/order.model';

/**
 * Domain-facing contract for cross-channel order consultation. The presentation layer depends
 * on this abstract class (Angular's DI token pattern), never on the concrete HTTP implementation
 * in `data/`.
 */
export abstract class OrderRepository {
  /** Every registered order, across channels — newest first. Staff only (pedidos.consultar). */
  abstract getAll(): Observable<OrderSummary[]>;
  /** Full detail (products, quantities, value, client, channel, status) for one order. 404s
   * when the id isn't registered — surfaced by the caller as OrderApiError. Staff only. */
  abstract getById(id: string): Observable<OrderDetail>;
  /**
   * Register a walk-in sale at the register (HU-06 — POS "Finalizar Venta"). Rejects with a
   * field error under `items` when a line exceeds the available stock.
   */
  abstract registerStoreSale(items: StoreSaleItem[]): Observable<StoreSaleReceipt>;
  /**
   * Advance an order's status (HU-14 crit. 1). Requires `pedidos.actualizar_estado`. Rejects
   * with a field error under `newStatus` for an invalid value or transition.
   */
  abstract updateStatus(id: string, payload: UpdateOrderStatusPayload): Observable<OrderDetail>;
  /** The authenticated customer's own orders, newest first (HU-14 crit. 2 — "mis pedidos"). */
  abstract getMine(): Observable<OrderSummary[]>;
  /** Detail of one of the authenticated customer's own orders. 404s if it isn't theirs. */
  abstract getMineById(id: string): Observable<OrderDetail>;
}
