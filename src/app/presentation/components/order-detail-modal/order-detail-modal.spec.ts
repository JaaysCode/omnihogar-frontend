import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideTaiga, TuiAlertService } from '@taiga-ui/core';
import { EMPTY, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { OrderDetailModal } from './order-detail-modal';
import { OrderApiError, OrderDetail } from '../../../domain/models/order.model';
import { OrderRepository } from '../../../domain/repositories/order.repository';
import { AuthSessionService } from '../../../core/services/auth-session.service';

const ORDER: OrderDetail = {
  id: 'o1',
  orderNumber: 'ORD-1',
  channel: 'web',
  status: 'preparing',
  subtotal: 100_000,
  total: 100_000,
  createdAt: '2026-01-01T00:00:00Z',
  customerName: 'Camila Ruiz',
  customerEmail: 'camila@example.com',
  items: [],
};

describe('OrderDetailModal', () => {
  let fixture: ComponentFixture<OrderDetailModal>;
  let orderRepository: {
    getById: ReturnType<typeof vi.fn>;
    getMineById: ReturnType<typeof vi.fn>;
    updateStatus: ReturnType<typeof vi.fn>;
  };

  function setup(canUpdate: boolean): void {
    orderRepository = { getById: vi.fn(), getMineById: vi.fn(), updateStatus: vi.fn() };
    orderRepository.getById.mockReturnValue(of(ORDER));

    TestBed.configureTestingModule({
      imports: [OrderDetailModal],
      providers: [
        provideTaiga(),
        { provide: TuiAlertService, useValue: { open: () => EMPTY } },
        { provide: OrderRepository, useValue: orderRepository },
        { provide: AuthSessionService, useValue: { hasPermission: () => canUpdate } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderDetailModal);
    fixture.componentRef.setInput('orderId', 'o1');
    fixture.detectChanges();
  }

  it('calls updateStatus with the selected status and refreshes the detail on success', () => {
    setup(true);
    orderRepository.updateStatus.mockReturnValue(of({ ...ORDER, status: 'packed' }));

    fixture.componentInstance['onSelectStatus']('packed');
    fixture.componentInstance['onSubmit']();

    expect(orderRepository.updateStatus).toHaveBeenCalledWith('o1', { status: 'packed' });
    expect(fixture.componentInstance['detail']()?.status).toBe('packed');
  });

  it('sets formError from the first field error on failure', () => {
    setup(true);
    orderRepository.updateStatus.mockReturnValue(
      throwError(() => new OrderApiError('generic', { newStatus: ['No es posible pasar del estado actual al estado seleccionado.'] })),
    );

    fixture.componentInstance['onSelectStatus']('delivered');
    fixture.componentInstance['onSubmit']();

    expect(fixture.componentInstance['formError']()).toBe(
      'No es posible pasar del estado actual al estado seleccionado.',
    );
  });

  it('does not render the status dropdown when the viewer lacks the permission', () => {
    setup(false);

    const dropdownTrigger = fixture.debugElement.query(By.css('[tuiDropdown]'));
    expect(dropdownTrigger).toBeNull();
  });
});
