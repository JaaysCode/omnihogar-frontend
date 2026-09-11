import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TuiAlertService, TuiButton, TuiIcon } from '@taiga-ui/core';
import { CheckoutApiError, CheckoutStatus } from '../../../domain/models/checkout.model';
import { CheckoutRepository } from '../../../domain/repositories/checkout.repository';
import { CopCurrencyPipe } from '../../../shared/pipes/cop-currency.pipe';
import { PublicHeader } from '../../components/public-header/public-header';

/**
 * Where Mercado Pago's Checkout Pro sends the buyer back (HU-09). Reads `order` (ours) and
 * `payment_id` (Mercado Pago's) straight off the URL — not through `withComponentInputBinding`,
 * since `payment_id` isn't a name we control. `getStatus` verifies against Mercado Pago itself;
 * the query params are only a hint of what to check, never trusted at face value.
 */
@Component({
  selector: 'app-checkout-result-page',
  imports: [RouterLink, PublicHeader, CopCurrencyPipe, TuiButton, TuiIcon],
  templateUrl: './checkout-result-page.html',
  styleUrl: './checkout-result-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutResultPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly checkoutRepository = inject(CheckoutRepository);
  private readonly alerts = inject(TuiAlertService);

  protected readonly status = signal<CheckoutStatus | null>(null);
  protected readonly loadError = signal<string | null>(null);
  protected readonly checking = signal(false);
  protected readonly retrying = signal(false);

  private orderId = '';

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.orderId = params.get('order') ?? '';

    if (!this.orderId) {
      this.loadError.set($localize`:@@checkout.result.error.missingOrder:No se encontró el pedido.`);
      return;
    }

    this.fetchStatus(params.get('payment_id') ?? undefined);
  }

  protected refresh(): void {
    this.fetchStatus(undefined);
  }

  protected retryPayment(): void {
    this.retrying.set(true);
    this.checkoutRepository.retry(this.orderId).subscribe({
      next: (preference) => {
        window.location.href = preference.initPoint;
      },
      error: (error: CheckoutApiError) => {
        this.retrying.set(false);
        this.alerts.open(error.message, { appearance: 'negative' }).subscribe();
      },
    });
  }

  private fetchStatus(paymentId: string | undefined): void {
    this.checking.set(true);
    this.checkoutRepository.getStatus(this.orderId, paymentId).subscribe({
      next: (status) => {
        this.checking.set(false);
        this.status.set(status);
      },
      error: (error: CheckoutApiError) => {
        this.checking.set(false);
        this.loadError.set(error.message);
      },
    });
  }
}
