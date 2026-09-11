import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideTaiga, TuiAlertService } from '@taiga-ui/core';
import { EMPTY, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { PosPage } from './pos-page';
import { Product } from '../../../domain/models/product.model';
import { OrderApiError } from '../../../domain/models/order.model';
import { ProductRepository } from '../../../domain/repositories/product.repository';
import { OrderRepository } from '../../../domain/repositories/order.repository';

const PRODUCT: Product = {
  id: 'p1',
  sku: 'SKU-1',
  name: 'Silla',
  description: null,
  categoryId: null,
  price: 100,
  imageUrl: null,
  status: 'active',
  availableQuantity: 5,
  inStock: true,
};

describe('PosPage', () => {
  let fixture: ComponentFixture<PosPage>;
  let productRepository: { getCatalog: ReturnType<typeof vi.fn> };
  let orderRepository: { getAll: ReturnType<typeof vi.fn>; getById: ReturnType<typeof vi.fn>; registerStoreSale: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    productRepository = { getCatalog: vi.fn().mockReturnValue(of([PRODUCT])) };
    orderRepository = { getAll: vi.fn(), getById: vi.fn(), registerStoreSale: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [PosPage],
      providers: [
        provideRouter([]),
        provideTaiga(),
        { provide: TuiAlertService, useValue: { open: () => EMPTY } },
        { provide: ProductRepository, useValue: productRepository },
        { provide: OrderRepository, useValue: orderRepository },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PosPage);
    fixture.detectChanges();
  });

  function addProductToCart(): void {
    fixture.componentInstance['addToCart'](PRODUCT);
    fixture.detectChanges();
  }

  it('the finalize button is disabled with an empty cart', () => {
    const button = fixture.debugElement.query(By.css('.pos-finalize')).nativeElement as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('registers the sale with the cart lines mapped to productId/quantity', () => {
    orderRepository.registerStoreSale.mockReturnValue(
      of({ orderId: 'o1', orderNumber: 'POS-1', subtotal: 100, tax: 19, total: 119, createdAt: '2026-09-10T00:00:00Z' }),
    );
    addProductToCart();

    fixture.debugElement.query(By.css('.pos-finalize')).nativeElement.click();

    expect(orderRepository.registerStoreSale).toHaveBeenCalledWith([{ productId: 'p1', quantity: 1 }]);
  });

  it('shows the receipt with the order number and empties the cart on success', () => {
    orderRepository.registerStoreSale.mockReturnValue(
      of({ orderId: 'o1', orderNumber: 'POS-20260910-1234', subtotal: 100, tax: 19, total: 119, createdAt: '2026-09-10T00:00:00Z' }),
    );
    addProductToCart();

    fixture.debugElement.query(By.css('.pos-finalize')).nativeElement.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('POS-20260910-1234');
    expect(fixture.componentInstance['cart']()).toEqual([]);
  });

  it('on insufficient-stock error: shows the message and keeps the cart intact', () => {
    orderRepository.registerStoreSale.mockReturnValue(
      throwError(
        () =>
          new OrderApiError("No hay suficiente inventario de 'Silla'. Disponible: 2.", {
            items: ["No hay suficiente inventario de 'Silla'. Disponible: 2."],
          }),
      ),
    );
    addProductToCart();

    fixture.debugElement.query(By.css('.pos-finalize')).nativeElement.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain("No hay suficiente inventario de 'Silla'. Disponible: 2.");
    expect(fixture.componentInstance['cart']()).toHaveLength(1);
  });
});
