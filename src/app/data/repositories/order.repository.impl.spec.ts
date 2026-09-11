import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { OrderRepositoryImpl } from './order.repository.impl';
import { OrderApiService } from '../services/order-api.service';
import { OrderApiError } from '../../domain/models/order.model';
import { StoreSaleReceiptDto } from '../services/order-api.dto';

const RECEIPT_DTO: StoreSaleReceiptDto = {
  orderId: 'o1',
  orderNumber: 'POS-1',
  subtotal: 100,
  tax: 19,
  total: 119,
  createdAt: '2026-09-10T00:00:00Z',
};

describe('OrderRepositoryImpl', () => {
  let repository: OrderRepositoryImpl;
  let api: {
    getAll: ReturnType<typeof vi.fn>;
    getById: ReturnType<typeof vi.fn>;
    registerStoreSale: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    api = { getAll: vi.fn(), getById: vi.fn(), registerStoreSale: vi.fn() };
    TestBed.configureTestingModule({
      providers: [OrderRepositoryImpl, { provide: OrderApiService, useValue: api }],
    });
    repository = TestBed.inject(OrderRepositoryImpl);
  });

  it('maps the receipt DTO to the domain shape', () => {
    api.registerStoreSale.mockReturnValue(of(RECEIPT_DTO));

    let receipt;
    repository.registerStoreSale([{ productId: 'p1', quantity: 2 }]).subscribe((r) => (receipt = r));

    expect(receipt).toEqual({
      orderId: 'o1',
      orderNumber: 'POS-1',
      subtotal: 100,
      tax: 19,
      total: 119,
      createdAt: '2026-09-10T00:00:00Z',
    });
  });

  it('passes the items through to the API', () => {
    api.registerStoreSale.mockReturnValue(of(RECEIPT_DTO));

    repository.registerStoreSale([{ productId: 'p1', quantity: 3 }]).subscribe();

    expect(api.registerStoreSale).toHaveBeenCalledWith([{ productId: 'p1', quantity: 3 }]);
  });

  it('translates a failed sale into an OrderApiError with field errors', () => {
    api.registerStoreSale.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { status: 400, title: 'x', errors: { Items: ['Disponible: 1.'] } },
          }),
      ),
    );

    let caught: OrderApiError | undefined;
    repository.registerStoreSale([{ productId: 'p1', quantity: 5 }]).subscribe({ error: (err) => (caught = err) });

    expect(caught).toBeInstanceOf(OrderApiError);
    expect(caught?.fieldErrors).toEqual({ items: ['Disponible: 1.'] });
  });
});
