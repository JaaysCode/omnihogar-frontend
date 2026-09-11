import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideTaiga, TuiAlertService } from '@taiga-ui/core';
import { EMPTY, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { CheckoutResultPage } from './checkout-result-page';
import { CheckoutApiError, CheckoutStatus } from '../../../domain/models/checkout.model';
import { CheckoutRepository } from '../../../domain/repositories/checkout.repository';
import { CartStore } from '../../../core/services/cart-store.service';

function statusOf(overrides: Partial<CheckoutStatus>): CheckoutStatus {
  return {
    orderId: 'o1',
    orderNumber: 'WEB-1',
    orderStatus: 'pending_payment',
    paymentStatus: 'pending',
    total: 119,
    gatewayUnavailable: false,
    ...overrides,
  };
}

describe('CheckoutResultPage', () => {
  let fixture: ComponentFixture<CheckoutResultPage>;
  let checkoutRepository: { createPreference: ReturnType<typeof vi.fn>; retry: ReturnType<typeof vi.fn>; getStatus: ReturnType<typeof vi.fn> };

  // Builds the TestBed + component WITHOUT running change detection yet, so callers can
  // configure the (freshly created) repository mocks before `ngOnInit` fires.
  function build(queryParams: Record<string, string>) {
    checkoutRepository = { createPreference: vi.fn(), retry: vi.fn(), getStatus: vi.fn() };

    TestBed.configureTestingModule({
      imports: [CheckoutResultPage],
      providers: [
        provideRouter([]),
        provideTaiga(),
        { provide: TuiAlertService, useValue: { open: () => EMPTY } },
        { provide: CheckoutRepository, useValue: checkoutRepository },
        { provide: CartStore, useValue: { itemCount: signal(0), clear: vi.fn() } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(queryParams) } },
        },
      ],
    });

    fixture = TestBed.createComponent(CheckoutResultPage);
  }

  it('shows an error when the order id is missing from the URL', () => {
    build({});
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No se encontró el pedido.');
    expect(checkoutRepository.getStatus).not.toHaveBeenCalled();
  });

  it('queries the status with the order and payment id from the URL', () => {
    build({ order: 'o1', payment_id: 'pay-1' });
    checkoutRepository.getStatus.mockReturnValue(of(statusOf({})));

    fixture.detectChanges();

    expect(checkoutRepository.getStatus).toHaveBeenCalledWith('o1', 'pay-1');
  });

  it('shows the approved state', () => {
    build({ order: 'o1' });
    checkoutRepository.getStatus.mockReturnValue(of(statusOf({ orderStatus: 'payment_approved', paymentStatus: 'approved' })));

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('¡Pago aprobado!');
    expect(fixture.nativeElement.textContent).toContain('WEB-1');
  });

  it('shows the rejected state with a retry button', () => {
    build({ order: 'o1' });
    checkoutRepository.getStatus.mockReturnValue(of(statusOf({ orderStatus: 'payment_rejected', paymentStatus: 'rejected' })));
    checkoutRepository.retry.mockReturnValue(of({ orderId: 'o1', orderNumber: 'WEB-1', initPoint: 'https://mercadopago.com/x' }));

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Pago rechazado');

    fixture.debugElement.query(By.css('button')).nativeElement.click();
    expect(checkoutRepository.retry).toHaveBeenCalledWith('o1');
  });

  it('shows the pending state and a gateway-unavailable note', () => {
    build({ order: 'o1' });
    checkoutRepository.getStatus.mockReturnValue(of(statusOf({ gatewayUnavailable: true })));

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Tu pedido está guardado');
    expect(fixture.nativeElement.textContent).toContain('Todavía no pudimos confirmar tu pago');
  });

  it('shows the load error banner when getStatus fails', () => {
    build({ order: 'o1' });
    checkoutRepository.getStatus.mockReturnValue(throwError(() => new CheckoutApiError('El pedido no existe.')));

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('El pedido no existe.');
  });
});
