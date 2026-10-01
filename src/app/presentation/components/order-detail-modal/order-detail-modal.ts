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
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { TuiAlertService, TuiButton, TuiDataList, TuiDropdown, TuiIcon } from '@taiga-ui/core';
import { TuiChevron } from '@taiga-ui/kit';
import { CopCurrencyPipe } from '../../../shared/pipes/cop-currency.pipe';
import {
  ORDER_CHANNEL_LABELS,
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONES,
  OrderApiError,
  OrderChannel,
  OrderDetail,
  OrderStatus,
} from '../../../domain/models/order.model';
import { OrderRepository } from '../../../domain/repositories/order.repository';
import { AuthSessionService } from '../../../core/services/auth-session.service';

/**
 * Detail view for one order (products, quantities, value, client, channel, status). Rendered by
 * orders-page (staff, `scope="staff"`) or my-orders-page (customer, `scope="mine"`) inside an
 * `@if`/`@defer` block driven by a `?order` query param — same modal shell/backdrop/Escape/focus
 * pattern as create-product-page. When the viewer holds `pedidos.actualizar_estado` (HU-14 crit.
 * 1), the status renders as an editable dropdown instead of a read-only pill — this never
 * applies to customers (`scope="mine"`), since Cliente has no permission claims.
 */
@Component({
  selector: 'app-order-detail-modal',
  imports: [TuiButton, TuiChevron, TuiDataList, TuiDropdown, TuiIcon, DatePipe, CopCurrencyPipe],
  templateUrl: './order-detail-modal.html',
  styleUrl: './order-detail-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderDetailModal implements OnInit, AfterViewInit, OnDestroy {
  private readonly orderRepository = inject(OrderRepository);
  private readonly document = inject(DOCUMENT);
  private readonly auth = inject(AuthSessionService);
  private readonly alerts = inject(TuiAlertService);

  /** Order id to load — required, set from the parent's `?order` query param. */
  readonly orderId = input.required<string>();

  /** Which endpoint to load from — staff's cross-channel view, or the customer's own order. */
  readonly scope = input<'staff' | 'mine'>('staff');

  /** Emitted on close button, backdrop click, or Escape — parent clears `?order`. */
  readonly closed = output<void>();

  @ViewChild('panel') private readonly panel?: ElementRef<HTMLElement>;

  protected readonly detail = signal<OrderDetail | null>(null);
  protected readonly loadError = signal<string | null>(null);

  protected readonly statusOptions = ORDER_STATUSES;
  protected readonly selectedStatus = signal<OrderStatus | null>(null);
  protected readonly menuOpen = signal(false);
  protected readonly pending = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly canUpdateStatus = computed(
    () => this.scope() === 'staff' && this.auth.hasPermission('pedidos.actualizar_estado'),
  );

  protected readonly dirty = computed(() => {
    const selected = this.selectedStatus();
    return selected !== null && selected !== this.detail()?.status;
  });

  constructor() {
    // Lock background scroll while the modal is open; restored in ngOnDestroy.
    this.document.body.style.overflow = 'hidden';
  }

  ngOnInit(): void {
    const load$ = this.scope() === 'mine'
      ? this.orderRepository.getMineById(this.orderId())
      : this.orderRepository.getById(this.orderId());

    load$.subscribe({
      next: (detail) => {
        this.detail.set(detail);
        this.selectedStatus.set(detail.status);
      },
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
    return ORDER_CHANNEL_LABELS[channel];
  }

  protected statusLabel(status: OrderStatus): string {
    return ORDER_STATUS_LABELS[status];
  }

  protected statusTone(status: OrderStatus): string {
    return ORDER_STATUS_TONES[status];
  }

  protected onSelectStatus(status: OrderStatus): void {
    this.selectedStatus.set(status);
    this.menuOpen.set(false);
  }

  protected onSubmit(): void {
    const newStatus = this.selectedStatus();
    if (!newStatus || !this.dirty()) {
      return;
    }

    this.pending.set(true);
    this.formError.set(null);

    this.orderRepository.updateStatus(this.orderId(), { status: newStatus }).subscribe({
      next: (updated) => {
        this.pending.set(false);
        this.detail.set(updated);
        this.selectedStatus.set(updated.status);
        this.alerts
          .open($localize`:@@orders.detail.statusUpdated:Estado del pedido actualizado.`, { appearance: 'positive' })
          .subscribe();
      },
      error: (error: OrderApiError) => {
        this.pending.set(false);
        const firstFieldError = error.fieldErrors ? Object.values(error.fieldErrors)[0]?.[0] : undefined;
        this.formError.set(firstFieldError ?? error.message);
      },
    });
  }
}
