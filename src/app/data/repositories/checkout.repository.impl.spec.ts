import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { CheckoutRepositoryImpl } from './checkout.repository.impl';
import { CheckoutApiService } from '../services/checkout-api.service';
import { CheckoutApiError } from '../../domain/models/checkout.model';
import { CheckoutDto } from '../services/checkout-api.dto';

const PREFERENCE_DTO: CheckoutDto = { orderId: 'o1', orderNumber: 'WEB-1', initPoint: 'https://mercadopago.com/checkout/1' };

describe('CheckoutRepositoryImpl', () => {
  let repository: CheckoutRepositoryImpl;
  let api: { createPreference: ReturnType<typeof vi.fn>; retry: ReturnType<typeof vi.fn>; getStatus: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    api = { createPreference: vi.fn(), retry: vi.fn(), getStatus: vi.fn() };
    TestBed.configureTestingModule({
      providers: [CheckoutRepositoryImpl, { provide: CheckoutApiService, useValue: api }],
    });
    repository = TestBed.inject(CheckoutRepositoryImpl);
  });

  it('maps the preference DTO to the domain shape on createPreference', () => {
    api.createPreference.mockReturnValue(of(PREFERENCE_DTO));

    let preference;
    repository
      .createPreference({ address: 'Calle 1', city: 'Bogotá', neighborhood: null, reference: null }, 'card')
      .subscribe((p) => (preference = p));

    expect(preference).toEqual({ orderId: 'o1', orderNumber: 'WEB-1', initPoint: 'https://mercadopago.com/checkout/1' });
  });

  it('passes the address and payment method through to the API', () => {
    api.createPreference.mockReturnValue(of(PREFERENCE_DTO));
    const address = { address: 'Calle 1', city: 'Bogotá', neighborhood: 'Centro', reference: null };

    repository.createPreference(address, 'pse').subscribe();

    expect(api.createPreference).toHaveBeenCalledWith(address, 'pse');
  });

  it('translates a failed createPreference into a CheckoutApiError with field errors', () => {
    api.createPreference.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { status: 400, title: 'x', errors: { 'Address.City': ['La ciudad es obligatoria.'] } },
          }),
      ),
    );

    let caught: CheckoutApiError | undefined;
    repository
      .createPreference({ address: 'Calle 1', city: '', neighborhood: null, reference: null }, 'card')
      .subscribe({ error: (err) => (caught = err) });

    expect(caught).toBeInstanceOf(CheckoutApiError);
    expect(caught?.fieldErrors).toEqual({ city: ['La ciudad es obligatoria.'] });
  });

  it('maps the status DTO on getStatus', () => {
    api.getStatus.mockReturnValue(
      of({ orderId: 'o1', orderNumber: 'WEB-1', orderStatus: 'payment_approved', paymentStatus: 'approved', total: 119, gatewayUnavailable: false }),
    );

    let status;
    repository.getStatus('o1', 'pay-1').subscribe((s) => (status = s));

    expect(api.getStatus).toHaveBeenCalledWith('o1', 'pay-1');
    expect(status).toEqual({
      orderId: 'o1',
      orderNumber: 'WEB-1',
      orderStatus: 'payment_approved',
      paymentStatus: 'approved',
      total: 119,
      gatewayUnavailable: false,
    });
  });

  it('translates a failed retry into a CheckoutApiError', () => {
    api.retry.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404 })));

    let caught: CheckoutApiError | undefined;
    repository.retry('o1').subscribe({ error: (err) => (caught = err) });

    expect(caught?.message).toBe('El pedido no existe.');
  });
});
