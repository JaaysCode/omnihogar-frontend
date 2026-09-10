import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Cart } from '../../domain/models/cart.model';
import { CartRepository } from '../../domain/repositories/cart.repository';
import { AuthSessionService } from './auth-session.service';

/**
 * App-wide holder for the client's shopping cart (HU-05). The server is the source of
 * truth: `load()` fetches it, and every mutation swaps in the fresh cart the backend
 * returns. Mirrors `AuthSessionService`'s signal + computed-selectors shape, minus the
 * localStorage backing.
 */
@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly cartRepository = inject(CartRepository);
  private readonly session = inject(AuthSessionService);

  private readonly cart = signal<Cart | null>(null);

  readonly items = computed(() => this.cart()?.items ?? []);
  readonly itemCount = computed(() => this.cart()?.itemCount ?? 0);
  readonly subtotal = computed(() => this.cart()?.subtotal ?? 0);
  readonly total = computed(() => this.cart()?.total ?? 0);

  /** Fetch the cart from the server. No-op when signed out (anonymous users have no cart). */
  load(): void {
    if (!this.session.isAuthenticated()) {
      return;
    }
    this.cartRepository.getCart().subscribe({
      next: (cart) => this.cart.set(cart),
      error: () => this.cart.set(null),
    });
  }

  add(productId: string, quantity: number): Observable<Cart> {
    return this.cartRepository.addItem(productId, quantity).pipe(tap((cart) => this.cart.set(cart)));
  }

  updateQuantity(productId: string, quantity: number): Observable<Cart> {
    return this.cartRepository
      .updateItemQuantity(productId, quantity)
      .pipe(tap((cart) => this.cart.set(cart)));
  }

  remove(productId: string): Observable<Cart> {
    return this.cartRepository.removeItem(productId).pipe(tap((cart) => this.cart.set(cart)));
  }

  /** Drop the local cart (e.g. on logout). */
  clear(): void {
    this.cart.set(null);
  }
}
