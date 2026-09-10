import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TuiButton, TuiIcon, TuiAlertService } from '@taiga-ui/core';
import { CartApiError, CartItem } from '../../../domain/models/cart.model';
import { CartStore } from '../../../core/services/cart-store.service';
import { CopCurrencyPipe } from '../../../shared/pipes/cop-currency.pipe';
import { PublicHeader } from '../../components/public-header/public-header';

/**
 * The client's shopping cart (HU-05). Reachable at `/cart` (auth required). Reads/writes
 * through `CartStore`; the checkout button is inert until HU-08 (pago) lands.
 */
@Component({
  selector: 'app-cart-page',
  imports: [RouterLink, PublicHeader, CopCurrencyPipe, TuiButton, TuiIcon],
  templateUrl: './cart-page.html',
  styleUrl: './cart-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartPage implements OnInit {
  private readonly cartStore = inject(CartStore);
  private readonly alerts = inject(TuiAlertService);

  protected readonly items = this.cartStore.items;
  protected readonly itemCount = this.cartStore.itemCount;
  protected readonly subtotal = this.cartStore.subtotal;
  protected readonly total = this.cartStore.total;

  ngOnInit(): void {
    this.cartStore.load();
  }

  protected onDecrease(item: CartItem): void {
    if (item.quantity <= 1) {
      return;
    }
    this.cartStore.updateQuantity(item.productId, item.quantity - 1).subscribe({ error: (e) => this.showError(e) });
  }

  protected onIncrease(item: CartItem): void {
    if (item.quantity >= item.availableQuantity) {
      return;
    }
    this.cartStore.updateQuantity(item.productId, item.quantity + 1).subscribe({ error: (e) => this.showError(e) });
  }

  protected onRemove(item: CartItem): void {
    this.cartStore.remove(item.productId).subscribe({ error: (e) => this.showError(e) });
  }

  private showError(error: CartApiError): void {
    this.alerts.open(error.message, { appearance: 'negative' }).subscribe();
  }
}
