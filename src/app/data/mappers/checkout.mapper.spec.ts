import { HttpErrorResponse } from '@angular/common/http';
import { toCheckoutApiError, toCheckoutPreference, toCheckoutStatus } from './checkout.mapper';
import { CheckoutDto, CheckoutStatusDto } from '../services/checkout-api.dto';

describe('toCheckoutPreference', () => {
  it('maps the DTO 1:1', () => {
    const dto: CheckoutDto = { orderId: 'o1', orderNumber: 'WEB-1', initPoint: 'https://mercadopago.com/checkout/1' };

    expect(toCheckoutPreference(dto)).toEqual({
      orderId: 'o1',
      orderNumber: 'WEB-1',
      initPoint: 'https://mercadopago.com/checkout/1',
    });
  });
});

describe('toCheckoutStatus', () => {
  it('maps known statuses through', () => {
    const dto: CheckoutStatusDto = {
      orderId: 'o1',
      orderNumber: 'WEB-1',
      orderStatus: 'payment_approved',
      paymentStatus: 'approved',
      total: 119,
      gatewayUnavailable: false,
    };

    expect(toCheckoutStatus(dto)).toEqual({
      orderId: 'o1',
      orderNumber: 'WEB-1',
      orderStatus: 'payment_approved',
      paymentStatus: 'approved',
      total: 119,
      gatewayUnavailable: false,
    });
  });

  it('falls back to pending_payment/pending for an unrecognized status', () => {
    const dto: CheckoutStatusDto = {
      orderId: 'o1',
      orderNumber: 'WEB-1',
      orderStatus: 'something_new',
      paymentStatus: 'something_else',
      total: 0,
      gatewayUnavailable: false,
    };

    const status = toCheckoutStatus(dto);
    expect(status.orderStatus).toBe('pending_payment');
    expect(status.paymentStatus).toBe('pending');
  });
});

describe('toCheckoutApiError', () => {
  it('maps a nested field error ("Address.Address") down to its last segment, lowercased', () => {
    const httpError = new HttpErrorResponse({
      status: 400,
      error: { status: 400, title: 'x', errors: { 'Address.Address': ['La dirección es obligatoria.'] } },
    });

    const error = toCheckoutApiError(httpError);

    expect(error.fieldErrors).toEqual({ address: ['La dirección es obligatoria.'] });
    expect(error.message).toBe('La dirección es obligatoria.');
  });

  it('maps a top-level field error ("Gateway") by lowercasing its first letter', () => {
    const httpError = new HttpErrorResponse({
      status: 400,
      error: { status: 400, title: 'x', errors: { Gateway: ['No fue posible conectar con la pasarela de pago.'] } },
    });

    const error = toCheckoutApiError(httpError);

    expect(error.fieldErrors).toEqual({ gateway: ['No fue posible conectar con la pasarela de pago.'] });
  });

  it('maps a 401 to a "inicia sesión" message', () => {
    expect(toCheckoutApiError(new HttpErrorResponse({ status: 401 })).message).toBe(
      'Inicia sesión para continuar con tu compra.',
    );
  });

  it('maps a 404 to a not-found message', () => {
    expect(toCheckoutApiError(new HttpErrorResponse({ status: 404 })).message).toBe('El pedido no existe.');
  });

  it('maps a network failure (status 0) to a connectivity message', () => {
    expect(toCheckoutApiError(new HttpErrorResponse({ status: 0 })).message).toContain(
      'No se pudo conectar con el servidor',
    );
  });

  it('maps a non-HttpErrorResponse to a generic message', () => {
    expect(toCheckoutApiError(new Error('boom')).message).toBe('Ocurrió un error inesperado. Inténtalo de nuevo.');
  });
});
