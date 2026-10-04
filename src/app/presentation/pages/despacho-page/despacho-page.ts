import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TuiAlertService, TuiButton, TuiIcon } from '@taiga-ui/core';
import { AdminSidebar } from '../../components/admin-sidebar/admin-sidebar';
import { AdminTabBar } from '../../components/admin-tab-bar/admin-tab-bar';
import { OrderDetailModal } from '../../components/order-detail-modal/order-detail-modal';
import { ORDER_CHANNEL_LABELS, OrderApiError, OrderChannel, OrderSummary } from '../../../domain/models/order.model';
import { OrderRepository } from '../../../domain/repositories/order.repository';

/**
 * "Pedidos por preparar" (HU-12) — el encargado de despacho consulta los pedidos pendientes de
 * preparación (`Status === 'preparing'`), ve su detalle (reutiliza order-detail-modal de HU-14,
 * sin cambios) y los marca como preparados. Todas las filas comparten el mismo estado por
 * construcción, por eso no hay columna de estado — a diferencia de orders-page (HU-14), que lista
 * todos los canales/estados.
 */
@Component({
  selector: 'app-despacho-page',
  imports: [RouterLink, AdminSidebar, AdminTabBar, OrderDetailModal, TuiButton, TuiIcon, DatePipe],
  templateUrl: './despacho-page.html',
  styleUrl: './despacho-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DespachoPage implements OnInit {
  private readonly orderRepository = inject(OrderRepository);
  private readonly router = inject(Router);
  private readonly alerts = inject(TuiAlertService);

  /** Bound from the `?order` query param by withComponentInputBinding (see app.config.ts). */
  readonly order = input<string | undefined>(undefined);

  protected readonly orders = signal<OrderSummary[] | null>(null);
  protected readonly loadError = signal<string | null>(null);
  protected readonly markingId = signal<string | null>(null);

  ngOnInit(): void {
    this.orderRepository.getAll('preparing').subscribe({
      next: (orders) => this.orders.set(orders),
      error: (error: OrderApiError) => this.loadError.set(error.message),
    });
  }

  protected onModalClosed(): void {
    void this.router.navigate(['/despacho']);
  }

  protected channelLabel(channel: OrderChannel): string {
    return ORDER_CHANNEL_LABELS[channel];
  }

  protected markPrepared(orderToMark: OrderSummary): void {
    this.markingId.set(orderToMark.id);
    this.loadError.set(null);

    this.orderRepository.updateStatus(orderToMark.id, { status: 'packed' }).subscribe({
      next: () => {
        this.markingId.set(null);
        this.orders.update((list) => (list ?? []).filter((o) => o.id !== orderToMark.id));
        this.alerts
          .open($localize`:@@despacho.list.markedPrepared:Pedido marcado como preparado.`, { appearance: 'positive' })
          .subscribe();
      },
      error: (error: OrderApiError) => {
        this.markingId.set(null);
        this.loadError.set(error.message);
      },
    });
  }
}
