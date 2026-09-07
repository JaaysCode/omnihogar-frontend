import { DOCUMENT, DatePipe } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { TuiIcon } from '@taiga-ui/core';
import { CopCurrencyPipe } from '../../../shared/pipes/cop-currency.pipe';
import { OrderApiError, OrderChannel, OrderDetail, OrderStatus } from '../../../domain/models/order.model';
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

/**
 * Detail view for one order (products, quantities, value, client, channel, status). Rendered by
 * orders-page inside an `@if`/`@defer` block driven by the `?order` query param — same modal
 * shell/backdrop/Escape/focus pattern as create-product-page.
 */
@Component({
  selector: 'app-order-detail-modal',
  imports: [TuiIcon, DatePipe, CopCurrencyPipe],
  templateUrl: './order-detail-modal.html',
  styleUrl: './order-detail-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderDetailModal implements OnInit, AfterViewInit, OnDestroy {
  private readonly orderRepository = inject(OrderRepository);
  private readonly document = inject(DOCUMENT);

  /** Order id to load — required, set from the parent's `?order` query param. */
  readonly orderId = input.required<string>();

  /** Emitted on close button, backdrop click, or Escape — parent clears `?order`. */
  readonly closed = output<void>();

  @ViewChild('panel') private readonly panel?: ElementRef<HTMLElement>;

  protected readonly detail = signal<OrderDetail | null>(null);
  protected readonly loadError = signal<string | null>(null);

  constructor() {
    // Lock background scroll while the modal is open; restored in ngOnDestroy.
    this.document.body.style.overflow = 'hidden';
  }

  ngOnInit(): void {
    this.orderRepository.getById(this.orderId()).subscribe({
      next: (detail) => this.detail.set(detail),
      error: (error: OrderApiError) => this.loadError.set(error.message),
    });
  }

  ngAfterViewInit(): void {
    // Move focus into the dialog so screen readers announce it and Tab stays sensible.
    this.panel?.nativeElement.focus();
  }

  ngOnDestroy(): void {
    this.document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  protected close(): void {
    this.closed.emit();
  }

  protected channelLabel(channel: OrderChannel): string {
    return CHANNEL_LABELS[channel];
  }

  protected statusLabel(status: OrderStatus): string {
    return STATUS_LABELS[status];
  }
}
