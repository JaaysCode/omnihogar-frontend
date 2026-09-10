import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { CartRepositoryImpl } from './cart.repository.impl';
import { CartApiService } from '../services/cart-api.service';
import { CartApiError } from '../../domain/models/cart.model';
import { CartDto } from '../services/cart-api.dto';

const CART_DTO: CartDto = {
  id: 'c1',
  items: [
    { productId: 'p1', sku: 'S1', name: 'Silla', imageUrl: null, unitPrice: 100, quantity: 2, subtotal: 200, availableQuantity: 5 },
  ],
  subtotal: 200,
  total: 200,
  itemCount: 2,
};

describe('CartRepositoryImpl', () => {
  let repository: CartRepositoryImpl;
  let api: {
    getCart: ReturnType<typeof vi.fn>;
    addItem: ReturnType<typeof vi.fn>;
    updateItemQuantity: ReturnType<typeof vi.fn>;
    removeItem: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    api = { getCart: vi.fn(), addItem: vi.fn(), updateItemQuantity: vi.fn(), removeItem: vi.fn() };
    TestBed.configureTestingModule({
      providers: [CartRepositoryImpl, { provide: CartApiService, useValue: api }],
    });
    repository = TestBed.inject(CartRepositoryImpl);
  });

  it('maps the cart DTO to the domain shape on getCart', () => {
    api.getCart.mockReturnValue(of(CART_DTO));

    let cart;
    repository.getCart().subscribe((c) => (cart = c));

    expect(cart).toEqual({
      id: 'c1',
      items: [
        { productId: 'p1', sku: 'S1', name: 'Silla', imageUrl: null, unitPrice: 100, quantity: 2, subtotal: 200, availableQuantity: 5 },
      ],
      subtotal: 200,
      total: 200,
      itemCount: 2,
    });
  });

  it('passes productId + quantity through to the API on addItem', () => {
    api.addItem.mockReturnValue(of(CART_DTO));

    repository.addItem('p1', 3).subscribe();

    expect(api.addItem).toHaveBeenCalledWith('p1', 3);
  });

  it('translates a failed addItem into a CartApiError with field errors', () => {
    api.addItem.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { status: 400, title: 'x', errors: { Quantity: ['Solo quedan 2 unidades disponibles.'] } },
          }),
      ),
    );

    let caught: CartApiError | undefined;
    repository.addItem('p1', 5).subscribe({ error: (err) => (caught = err) });

    expect(caught).toBeInstanceOf(CartApiError);
    expect(caught?.fieldErrors).toEqual({ quantity: ['Solo quedan 2 unidades disponibles.'] });
  });

  it('translates a failed removeItem into a CartApiError', () => {
    api.removeItem.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401 })));

    let caught: CartApiError | undefined;
    repository.removeItem('p1').subscribe({ error: (err) => (caught = err) });

    expect(caught?.message).toBe('Inicia sesión para usar el carrito.');
  });
});
