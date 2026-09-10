import { HttpErrorResponse } from '@angular/common/http';
import { toCart, toCartApiError, toCartItem } from './cart.mapper';
import { CartDto, CartItemDto } from '../services/cart-api.dto';

const ITEM: CartItemDto = {
  productId: 'p1',
  sku: 'SKU-1',
  name: 'Silla',
  imageUrl: null,
  unitPrice: 100,
  quantity: 2,
  subtotal: 200,
  availableQuantity: 7,
};

describe('toCartItem / toCart', () => {
  it('maps a cart DTO 1:1 to the domain shape', () => {
    const dto: CartDto = { id: 'c1', items: [ITEM], subtotal: 200, total: 200, itemCount: 2 };

    expect(toCart(dto)).toEqual({
      id: 'c1',
      items: [
        {
          productId: 'p1',
          sku: 'SKU-1',
          name: 'Silla',
          imageUrl: null,
          unitPrice: 100,
          quantity: 2,
          subtotal: 200,
          availableQuantity: 7,
        },
      ],
      subtotal: 200,
      total: 200,
      itemCount: 2,
    });
  });

  it('maps an empty cart', () => {
    expect(toCart({ id: '', items: [], subtotal: 0, total: 0, itemCount: 0 }).items).toEqual([]);
  });

  it('toCartItem copies every field', () => {
    expect(toCartItem(ITEM).availableQuantity).toBe(7);
  });
});

describe('toCartApiError', () => {
  it('maps a 400 with an errors dict to the first field message, lowercasing keys', () => {
    const httpError = new HttpErrorResponse({
      status: 400,
      error: { status: 400, title: 'x', errors: { Quantity: ['El producto no está disponible.'] } },
    });

    const error = toCartApiError(httpError);

    expect(error.fieldErrors).toEqual({ quantity: ['El producto no está disponible.'] });
    expect(error.message).toBe('El producto no está disponible.');
  });

  it('maps a 401 to a "inicia sesión" message', () => {
    expect(toCartApiError(new HttpErrorResponse({ status: 401 })).message).toBe(
      'Inicia sesión para usar el carrito.',
    );
  });

  it('maps a 404 to a not-in-cart message', () => {
    expect(toCartApiError(new HttpErrorResponse({ status: 404 })).message).toBe(
      'El producto no está en el carrito.',
    );
  });

  it('maps a network failure (status 0) to a connectivity message', () => {
    expect(toCartApiError(new HttpErrorResponse({ status: 0 })).message).toContain(
      'No se pudo conectar con el servidor',
    );
  });

  it('maps a non-HttpErrorResponse to a generic message', () => {
    expect(toCartApiError(new Error('boom')).message).toBe('Ocurrió un error inesperado. Inténtalo de nuevo.');
  });
});
