import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { CartStore } from './cart-store.service';
import { AuthSessionService } from './auth-session.service';
import { CartRepository } from '../../domain/repositories/cart.repository';
import { Cart } from '../../domain/models/cart.model';

const CART: Cart = {
  id: 'c1',
  items: [
    { productId: 'p1', sku: 'S1', name: 'Silla', imageUrl: null, unitPrice: 100, quantity: 2, subtotal: 200, availableQuantity: 5 },
  ],
  subtotal: 200,
  total: 200,
  itemCount: 2,
};

function configure(authenticated: boolean) {
  const cartRepository = {
    getCart: vi.fn().mockReturnValue(of(CART)),
    addItem: vi.fn().mockReturnValue(of(CART)),
    updateItemQuantity: vi.fn().mockReturnValue(of(CART)),
    removeItem: vi.fn().mockReturnValue(of({ ...CART, items: [], subtotal: 0, total: 0, itemCount: 0 })),
  };
  TestBed.configureTestingModule({
    providers: [
      CartStore,
      { provide: CartRepository, useValue: cartRepository },
      { provide: AuthSessionService, useValue: { isAuthenticated: () => authenticated } },
    ],
  });
  return { store: TestBed.inject(CartStore), cartRepository };
}

describe('CartStore', () => {
  it('starts empty', () => {
    const { store } = configure(true);
    expect(store.itemCount()).toBe(0);
    expect(store.subtotal()).toBe(0);
    expect(store.items()).toEqual([]);
  });

  it('load() populates the selectors from the server when authenticated', () => {
    const { store, cartRepository } = configure(true);
    store.load();
    expect(cartRepository.getCart).toHaveBeenCalled();
    expect(store.itemCount()).toBe(2);
    expect(store.subtotal()).toBe(200);
    expect(store.items()).toHaveLength(1);
  });

  it('load() is a no-op when signed out', () => {
    const { store, cartRepository } = configure(false);
    store.load();
    expect(cartRepository.getCart).not.toHaveBeenCalled();
  });

  it('add() swaps in the cart returned by the repository', () => {
    const { store, cartRepository } = configure(true);
    store.add('p1', 1).subscribe();
    expect(cartRepository.addItem).toHaveBeenCalledWith('p1', 1);
    expect(store.itemCount()).toBe(2);
  });

  it('remove() updates the selectors', () => {
    const { store } = configure(true);
    store.load();
    store.remove('p1').subscribe();
    expect(store.itemCount()).toBe(0);
  });

  it('clear() empties the local cart', () => {
    const { store } = configure(true);
    store.load();
    store.clear();
    expect(store.itemCount()).toBe(0);
    expect(store.items()).toEqual([]);
  });
});
