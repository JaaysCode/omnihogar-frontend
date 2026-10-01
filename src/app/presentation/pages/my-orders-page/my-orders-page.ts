import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
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

/**
 * "Mis pedidos" (HU-14 crit. 2) — lets an authenticated customer check the current status of
 * their own orders. Read-only: the status dropdown in order-detail-modal only renders for staff
 * holding `pedidos.actualizar_estado`, which Cliente never has. Same `?order` modal-over-list
 * pattern as the staff orders-page, scoped to `getMine()`/`scope="mine"` instead.
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
}
