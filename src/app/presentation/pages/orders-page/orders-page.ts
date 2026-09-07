import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TuiIcon } from '@taiga-ui/core';
import { AdminSidebar } from '../../components/admin-sidebar/admin-sidebar';
import { AdminTabBar } from '../../components/admin-tab-bar/admin-tab-bar';
import { OrderDetailModal } from '../../components/order-detail-modal/order-detail-modal';
import { CopCurrencyPipe } from '../../../shared/pipes/cop-currency.pipe';
import { OrderApiError, OrderChannel, OrderStatus, OrderSummary } from '../../../domain/models/order.model';
import { OrderRepository } from '../../../domain/repositories/order.repository';

const CHANNEL_LABELS: Record<OrderChannel, string> = {
  web: $localize`:@@orders.channel.web:Web`,
  store: $localize`:@@orders.channel.store:Tienda`,
  chat: $localize`:@@orders.channel.chat:Chat`,
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: $localize`:@@orders.status.pendingPayment:Pago pendiente`,
  payment_approved: $localize`:@@orders.status.paymentApproved:Pago aprobado`,
  preparing: $localize`:@@orders.status.preparing:Preparando`,
  packed: $localize`:@@orders.status.packed:Empacado`,
  shipped: $localize`:@@orders.status.shipped:Enviado`,
  delivered: $localize`:@@orders.status.delivered:Entregado`,
  cancelled: $localize`:@@orders.status.cancelled:Cancelado`,
  payment_rejected: $localize`:@@orders.status.paymentRejected:Pago rechazado`,
};

/** Visual tone per status — matches the pill classes used elsewhere in the admin panel. */
const STATUS_TONES: Record<OrderStatus, 'positive' | 'neutral' | 'warning' | 'negative'> = {
  pending_payment: 'warning',
  payment_approved: 'neutral',
  preparing: 'neutral',
  packed: 'neutral',
  shipped: 'neutral',
  delivered: 'positive',
  cancelled: 'negative',
  payment_rejected: 'negative',
};

/**
 * Cross-channel order consultation (advisor role): lists every registered order regardless of
 * the channel it came in through (web/store/chat), and opens a detail view for one order via the
 * `?order` query param — same modal-over-list pattern as "Nuevo Producto" in admin-products-page.
 */
@Component({
  selector: 'app-orders-page',
  imports: [RouterLink, AdminSidebar, AdminTabBar, OrderDetailModal, TuiIcon, DatePipe, CopCurrencyPipe],
  templateUrl: './orders-page.html',
  styleUrl: './orders-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersPage implements OnInit {
  private readonly orderRepository = inject(OrderRepository);
  private readonly router = inject(Router);

  /** Bound from the `?order` query param by withComponentInputBinding (see app.config.ts). */
  readonly order = input<string | undefined>(undefined);

  protected readonly orders = signal<OrderSummary[] | null>(null);
  protected readonly loadError = signal<string | null>(null);

  ngOnInit(): void {
    this.loadOrders();
  }

  private loadOrders(): void {
    this.orderRepository.getAll().subscribe({
      next: (orders) => this.orders.set(orders),
      error: (error: OrderApiError) => this.loadError.set(error.message),
    });
  }

  protected onModalClosed(): void {
    // Plain absolute navigate with no queryParams — same rationale as admin-products-page's
    // onModalClosed(): queryParamsHandling 'merge' + `{ order: null }` isn't reliable for
    // stripping a param, and the router's onSameUrlNavigation:'ignore' would then silently no-op.
    void this.router.navigate(['/admin/orders']);
  }

  protected channelLabel(channel: OrderChannel): string {
    return CHANNEL_LABELS[channel];
  }

  protected statusLabel(status: OrderStatus): string {
    return STATUS_LABELS[status];
  }

  protected statusTone(status: OrderStatus): string {
    return STATUS_TONES[status];
  }
}
