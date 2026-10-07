import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TuiIcon } from '@taiga-ui/core';
import { PublicHeader } from '../../components/public-header/public-header';
import { OrderDetailModal } from '../../components/order-detail-modal/order-detail-modal';
import { CopCurrencyPipe } from '../../../shared/pipes/cop-currency.pipe';
import {
  ORDER_CHANNEL_LABELS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONES,
  OrderApiError,
  OrderChannel,
  OrderStatus,
  OrderSummary,
} from '../../../domain/models/order.model';
import { OrderRepository } from '../../../domain/repositories/order.repository';

type OrderFilter = 'all' | 'active' | 'delivered' | 'closed';

/** Pasos visibles de la barra de progreso. `current` = índice del paso en curso; 5 = todos hechos. */
const PROGRESS_STEPS = [
  { key: 'approved', label: $localize`:@@myOrders.progress.approved:Pago aprobado` },
  { key: 'preparing', label: $localize`:@@myOrders.progress.preparing:Preparando` },
  { key: 'packed', label: $localize`:@@myOrders.progress.packed:Empacado` },
  { key: 'shipped', label: $localize`:@@myOrders.progress.shipped:Enviado` },
  { key: 'delivered', label: $localize`:@@myOrders.progress.delivered:Entregado` },
] as const;

const PROGRESS_INDEX: Partial<Record<OrderStatus, number>> = {
  pending_payment: 0,
  payment_approved: 0,
  preparing: 1,
  packed: 2,
  shipped: 3,
  delivered: 5,
};

/**
 * "Mis pedidos" (HU-14 crit. 2) — lets an authenticated customer check the current status of
 * their own orders. Read-only: the status dropdown in order-detail-modal only renders for staff
 * holding `pedidos.actualizar_estado`, which Cliente never has. Same `?order` modal-over-list
 * pattern as the staff orders-page, scoped to `getMine()`/`scope="mine"` instead.
 *
 * Presentación tipo tarjetas: pestañas por estado con conteo, una tarjeta por pedido con barra de
 * progreso. Los estados se agrupan en "En curso", "Entregados" y "Canceladas".
 */
@Component({
  selector: 'app-my-orders-page',
  imports: [RouterLink, PublicHeader, OrderDetailModal, TuiIcon, DatePipe, CopCurrencyPipe],
  templateUrl: './my-orders-page.html',
  styleUrl: './my-orders-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyOrdersPage implements OnInit {
  private readonly orderRepository = inject(OrderRepository);
  private readonly router = inject(Router);

  /** Bound from the `?order` query param by withComponentInputBinding (see app.config.ts). */
  readonly order = input<string | undefined>(undefined);

  protected readonly orders = signal<OrderSummary[] | null>(null);
  protected readonly loadError = signal<string | null>(null);
  protected readonly filter = signal<OrderFilter>('all');

  protected readonly progressSteps = PROGRESS_STEPS;

  /** Más recientes primero. */
  private readonly sorted = computed(() =>
    [...(this.orders() ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  );

  protected readonly tabs = computed(() => {
    const all = this.sorted();
    const count = (f: OrderFilter) => all.filter((o) => this.matches(o.status, f)).length;
    return [
      { id: 'all' as const, label: $localize`:@@myOrders.filter.all:Todos`, count: all.length },
      { id: 'active' as const, label: $localize`:@@myOrders.filter.active:En curso`, count: count('active') },
      { id: 'delivered' as const, label: $localize`:@@myOrders.filter.delivered:Entregados`, count: count('delivered') },
      { id: 'closed' as const, label: $localize`:@@myOrders.filter.closed:Canceladas`, count: count('closed') },
    ];
  });

  protected readonly visibleOrders = computed(() =>
    this.sorted().filter((o) => this.matches(o.status, this.filter())),
  );

  ngOnInit(): void {
    this.orderRepository.getMine().subscribe({
      next: (orders) => this.orders.set(orders),
      error: (error: OrderApiError) => this.loadError.set(error.message),
    });
  }

  protected onModalClosed(): void {
    void this.router.navigate(['/my-orders']);
  }

  protected channelLabel(channel: OrderChannel): string {
    return ORDER_CHANNEL_LABELS[channel];
  }

  protected statusLabel(status: OrderStatus): string {
    return ORDER_STATUS_LABELS[status];
  }

  protected statusTone(status: OrderStatus): string {
    return ORDER_STATUS_TONES[status];
  }

  /** Índice del paso actual, o null si el pedido se cerró (cancelado / pago rechazado). */
  protected progressFor(status: OrderStatus): { current: number } | null {
    const current = PROGRESS_INDEX[status];
    return current === undefined ? null : { current };
  }

  protected closedHint(status: OrderStatus): string {
    return status === 'payment_rejected'
      ? $localize`:@@myOrders.closed.paymentRejected:El pago no fue aprobado.`
      : $localize`:@@myOrders.closed.cancelled:Este pedido fue cancelado.`;
  }

  private matches(status: OrderStatus, filter: OrderFilter): boolean {
    switch (filter) {
      case 'active':
        return status in PROGRESS_INDEX && status !== 'delivered';
      case 'delivered':
        return status === 'delivered';
      case 'closed':
        return status === 'cancelled' || status === 'payment_rejected';
      default:
        return true;
    }
  }
}
