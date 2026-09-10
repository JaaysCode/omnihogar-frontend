import { Observable } from 'rxjs';
import { Cart } from '../models/cart.model';

/**
 * Domain-facing contract for the client's shopping cart (HU-05). The presentation layer
 * depends on this abstract class (Angular's DI token pattern), never on the concrete HTTP
 * implementation in `data/`. Every mutation resolves to the full updated cart.
 */
export abstract class CartRepository {
  abstract getCart(): Observable<Cart>;
  /** Add `quantity` units of a product, or bump an existing line (HU-05 crit. 1 / 4). */
  abstract addItem(productId: string, quantity: number): Observable<Cart>;
  /** Set the quantity of a line already in the cart (HU-05 crit. 2). */
  abstract updateItemQuantity(productId: string, quantity: number): Observable<Cart>;
  /** Drop a line from the cart (HU-05 crit. 3). */
  abstract removeItem(productId: string): Observable<Cart>;
}
