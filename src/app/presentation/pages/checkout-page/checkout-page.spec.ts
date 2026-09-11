import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideTaiga } from '@taiga-ui/core';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { CheckoutPage } from './checkout-page';
import { CheckoutApiError } from '../../../domain/models/checkout.model';
import { CheckoutRepository } from '../../../domain/repositories/checkout.repository';
import { CartItem } from '../../../domain/models/cart.model';
import { CartStore } from '../../../core/services/cart-store.service';

const LINE: CartItem = {
  productId: 'p1',
  sku: 'SKU-1',
  name: 'Silla',
  imageUrl: null,
  unitPrice: 100,
  quantity: 2,
  subtotal: 200,
  availableQuantity: 5,
};

describe('CheckoutPage', () => {
  let fixture: ComponentFixture<CheckoutPage>;
  let checkoutRepository: { createPreference: ReturnType<typeof vi.fn>; retry: ReturnType<typeof vi.fn>; getStatus: ReturnType<typeof vi.fn> };

  function build(items: CartItem[]) {
    checkoutRepository = { createPreference: vi.fn(), retry: vi.fn(), getStatus: vi.fn() };
    const cartStore = {
      items: signal(items),
      itemCount: signal(items.reduce((s, i) => s + i.quantity, 0)),
      subtotal: signal(items.reduce((s, i) => s + i.subtotal, 0)),
      total: signal(items.reduce((s, i) => s + i.subtotal, 0)),
      load: vi.fn(),
      clear: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [CheckoutPage],
      providers: [
        provideRouter([]),
        provideTaiga(),
        { provide: CheckoutRepository, useValue: checkoutRepository },
        { provide: CartStore, useValue: cartStore },
      ],
    });

    fixture = TestBed.createComponent(CheckoutPage);
    fixture.detectChanges();
  }

  function fillValidForm(): void {
    const instance = fixture.componentInstance as unknown as { form: { patchValue: (v: object) => void } };
    instance.form.patchValue({ address: 'Calle 123', city: 'Bogotá', paymentMethod: 'card' });
  }

  it('does not submit an invalid form', () => {
    build([LINE]);

    fixture.debugElement.query(By.css('form')).triggerEventHandler('ngSubmit');
    fixture.detectChanges();

    expect(checkoutRepository.createPreference).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Corrige lo siguiente');
  });

  it('submits the address and payment method mapped from the form', () => {
    build([LINE]);
    checkoutRepository.createPreference.mockReturnValue(
      of({ orderId: 'o1', orderNumber: 'WEB-1', initPoint: 'https://mercadopago.com/checkout/1' }),
    );
    fillValidForm();

    fixture.debugElement.query(By.css('form')).triggerEventHandler('ngSubmit');

    expect(checkoutRepository.createPreference).toHaveBeenCalledWith(
      { address: 'Calle 123', city: 'Bogotá', neighborhood: null, reference: null },
      'card',
    );
  });

  it('shows a field-level error returned by the backend', () => {
    build([LINE]);
    checkoutRepository.createPreference.mockReturnValue(
      throwError(() => new CheckoutApiError('La ciudad es obligatoria.', { city: ['La ciudad es obligatoria.'] })),
    );
    fillValidForm();

    fixture.debugElement.query(By.css('form')).triggerEventHandler('ngSubmit');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('La ciudad es obligatoria.');
  });

  it('shows a page-level banner for an error with no matching control (e.g. insufficient stock)', () => {
    build([LINE]);
    checkoutRepository.createPreference.mockReturnValue(
      throwError(() => new CheckoutApiError('Tu carrito está vacío.', { cart: ['Tu carrito está vacío.'] })),
    );
    fillValidForm();

    fixture.debugElement.query(By.css('form')).triggerEventHandler('ngSubmit');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Tu carrito está vacío.');
  });

  it('shows the empty-cart state when there is nothing to check out', () => {
    build([]);
    expect(fixture.nativeElement.textContent).toContain('Tu carrito está vacío.');
  });
});
