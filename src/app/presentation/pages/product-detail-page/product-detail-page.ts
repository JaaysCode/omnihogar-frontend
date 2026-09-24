import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TuiButton, TuiAlertService } from '@taiga-ui/core';
import { Product, ProductApiError } from '../../../domain/models/product.model';
import { CartApiError } from '../../../domain/models/cart.model';
import { ProductRepository } from '../../../domain/repositories/product.repository';
import { CartStore } from '../../../core/services/cart-store.service';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { CopCurrencyPipe } from '../../../shared/pipes/cop-currency.pipe';
import { PublicHeader } from '../../components/public-header/public-header';

/** Product detail (HU-18) — public, no auth required. "Agregar al carrito" reuses HU-05. */
@Component({
  selector: 'app-product-detail-page',
  imports: [CopCurrencyPipe, PublicHeader, TuiButton, RouterLink],
  templateUrl: './product-detail-page.html',
  styleUrl: './product-detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailPage implements OnInit {
  private readonly productRepository = inject(ProductRepository);
  private readonly cartStore = inject(CartStore);
  private readonly session = inject(AuthSessionService);
  private readonly router = inject(Router);
  private readonly alerts = inject(TuiAlertService);

  /** Product id — bound from the `:id` path param by withComponentInputBinding(). */
  readonly id = input.required<string>();

  protected readonly product = signal<Product | null>(null);
  protected readonly loadError = signal<string | null>(null);
  protected readonly adding = signal(false);

  ngOnInit(): void {
    this.productRepository.getById(this.id()).subscribe({
      next: (product) => this.product.set(product),
      error: (error: ProductApiError) => this.loadError.set(error.message),
    });
  }

  protected onAddToCart(): void {
    const product = this.product();
    if (!product || this.adding()) {
      return;
    }

    if (!this.session.isAuthenticated()) {
      this.alerts
        .open($localize`:@@cart.add.loginRequired:Inicia sesión para agregar productos al carrito.`, {
          appearance: 'warning',
        })
        .subscribe();
      void this.router.navigate(['/login']);
      return;
    }

    this.adding.set(true);
    this.cartStore.add(product.id, 1).subscribe({
      next: () => {
        this.adding.set(false);
        this.alerts
          .open($localize`:@@cart.add.success:Producto agregado al carrito.`, { appearance: 'positive' })
          .subscribe();
      },
      error: (error: CartApiError) => {
        this.adding.set(false);
        this.alerts.open(error.message, { appearance: 'negative' }).subscribe();
      },
    });
  }
}
