import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTaiga, TuiAlertService } from '@taiga-ui/core';
import { EMPTY, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { DespachoPage } from './despacho-page';
import { OrderRepository } from '../../../domain/repositories/order.repository';
import { OrderApiError, OrderSummary } from '../../../domain/models/order.model';
import { NotificationRepository } from '../../../domain/repositories/notification.repository';

const PREPARING_ORDER: OrderSummary = {
  id: 'o1',
  orderNumber: 'ORD-900',
  channel: 'web',
  status: 'preparing',
  total: 150000,
  createdAt: '2026-01-15T00:00:00Z',
  customerName: 'Ana Gómez',
  itemCount: 2,
};

describe('DespachoPage', () => {
  let fixture: ComponentFixture<DespachoPage>;
  let orderRepository: { getAll: ReturnType<typeof vi.fn>; updateStatus: ReturnType<typeof vi.fn> };
  let alerts: { open: ReturnType<typeof vi.fn> };

  function build(getAllResult = of([PREPARING_ORDER])) {
    orderRepository = {
      getAll: vi.fn().mockReturnValue(getAllResult),
      updateStatus: vi.fn().mockReturnValue(of({})),
    };
    alerts = { open: vi.fn().mockReturnValue(EMPTY) };
    // AdminSidebar/AdminTabBar both render <app-notification-bell>, which injects
    // NotificationRepository — stub it out, its behavior isn't under test here.
    const notificationRepository = { getMine: vi.fn().mockReturnValue(EMPTY) };

    TestBed.configureTestingModule({
      imports: [DespachoPage],
      providers: [
        provideRouter([]),
        provideTaiga(),
        { provide: TuiAlertService, useValue: alerts },
        { provide: OrderRepository, useValue: orderRepository },
        { provide: NotificationRepository, useValue: notificationRepository },
      ],
    });

    fixture = TestBed.createComponent(DespachoPage);
    fixture.detectChanges();
  }

  it('loads only pending-preparation orders and renders them', () => {
    build();
    expect(orderRepository.getAll).toHaveBeenCalledWith('preparing');
    expect(fixture.nativeElement.textContent).toContain('ORD-900');
  });

  it('marking an order as prepared updates its status and removes it from the list', () => {
    build();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.despacho-table__actions button');
    button.click();
    fixture.detectChanges();

    expect(orderRepository.updateStatus).toHaveBeenCalledWith('o1', { status: 'packed' });
    expect(fixture.nativeElement.textContent).not.toContain('ORD-900');
  });

  it('a failed "marcar como preparado" shows an error and keeps the order in the list', () => {
    build();
    orderRepository.updateStatus.mockReturnValue(throwError(() => new OrderApiError('boom')));

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.despacho-table__actions button');
    button.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('boom');
    expect(fixture.nativeElement.textContent).toContain('ORD-900');
  });
});
