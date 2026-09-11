import { HttpErrorResponse } from '@angular/common/http';
import { toOrderApiError, toStoreSaleReceipt } from './order.mapper';
import { StoreSaleReceiptDto } from '../services/order-api.dto';

describe('toStoreSaleReceipt', () => {
  it('maps the DTO 1:1 to the domain shape', () => {
    const dto: StoreSaleReceiptDto = {
      orderId: 'o1',
      orderNumber: 'POS-20260910-153045-1234',
      subtotal: 100,
      tax: 19,
      total: 119,
      createdAt: '2026-09-10T15:30:45Z',
    };

    expect(toStoreSaleReceipt(dto)).toEqual({
      orderId: 'o1',
      orderNumber: 'POS-20260910-153045-1234',
      subtotal: 100,
      tax: 19,
      total: 119,
      createdAt: '2026-09-10T15:30:45Z',
    });
  });
});

describe('toOrderApiError', () => {
  it('maps a 400 with an errors dict to the first field message, lowercasing keys', () => {
    const httpError = new HttpErrorResponse({
      status: 400,
      error: { status: 400, title: 'x', errors: { Items: ["No hay suficiente inventario de 'Silla'. Disponible: 2."] } },
    });

    const error = toOrderApiError(httpError);

    expect(error.fieldErrors).toEqual({ items: ["No hay suficiente inventario de 'Silla'. Disponible: 2."] });
    expect(error.message).toBe("No hay suficiente inventario de 'Silla'. Disponible: 2.");
  });

  it('maps a 400 with no errors dict to the problem title', () => {
    const httpError = new HttpErrorResponse({ status: 400, error: { status: 400, title: 'Solicitud inválida' } });

    const error = toOrderApiError(httpError);

    expect(error.fieldErrors).toBeUndefined();
    expect(error.message).toBe('Solicitud inválida');
  });

  it('maps a 401/403 to a forbidden message', () => {
    expect(toOrderApiError(new HttpErrorResponse({ status: 401 })).message).toBe(
      'No tienes permisos para consultar pedidos.',
    );
    expect(toOrderApiError(new HttpErrorResponse({ status: 403 })).message).toBe(
      'No tienes permisos para consultar pedidos.',
    );
  });

  it('maps a 404 to a not-found message', () => {
    expect(toOrderApiError(new HttpErrorResponse({ status: 404 })).message).toBe('El pedido no existe.');
  });

  it('maps a network failure (status 0) to a connectivity message', () => {
    expect(toOrderApiError(new HttpErrorResponse({ status: 0 })).message).toContain(
      'No se pudo conectar con el servidor',
    );
  });

  it('maps a non-HttpErrorResponse to a generic message', () => {
    expect(toOrderApiError(new Error('boom')).message).toBe('Ocurrió un error inesperado. Inténtalo de nuevo.');
  });
});
