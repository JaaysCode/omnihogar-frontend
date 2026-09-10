import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TuiButton, TuiIcon, TuiAlertService } from '@taiga-ui/core';
import { Product, ProductApiError } from '../../../domain/models/product.model';
import { CartApiError } from '../../../domain/models/cart.model';
import { ProductRepository } from '../../../domain/repositories/product.repository';
import { CartStore } from '../../../core/services/cart-store.service';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { CopCurrencyPipe } from '../../../shared/pipes/cop-currency.pipe';
import { PublicHeader } from '../../components/public-header/public-header';

/** Public product catalog (HU-4) — every customer, no auth required. "Agregar al carrito" (HU-05). */
@Component({
  selector: 'app-product-catalog-page',
  imports: [CopCurrencyPipe, PublicHeader, TuiButton, TuiIcon],
  templateUrl: './product-catalog-page.html',
  styleUrl: './product-catalog-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCatalogPage implements OnInit {
  private readonly productRepository = inject(ProductRepository);
  private readonly cartStore = inject(CartStore);
  private readonly session = inject(AuthSessionService);
  private readonly router = inject(Router);
  private readonly alerts = inject(TuiAlertService);

  protected readonly products = signal<Product[] | null>(null);
  protected readonly loadError = signal<string | null>(null);
  /** Product ids with an in-flight add request, to disable the button meanwhile. */
  protected readonly adding = signal<ReadonlySet<string>>(new Set());

  ngOnInit(): void {
    this.productRepository.getCatalog().subscribe({
      next: (products) => this.products.set(products),
      error: (error: ProductApiError) => this.loadError.set(error.message),
    });
    this.cartStore.load();
  }

  protected onAddToCart(product: Product): void {
    if (!this.session.isAuthenticated()) {
      this.alerts
        .open($localize`:@@cart.add.loginRequired:Inicia sesión para agregar productos al carrito.`, {
          appearance: 'warning',
        })
        .subscribe();
      void this.router.navigate(['/login']);
      return;
    }

    this.adding.update((set) => new Set(set).add(product.id));
    this.cartStore.add(product.id, 1).subscribe({
      next: () => {
        this.adding.update((set) => {
          const next = new Set(set);
          next.delete(product.id);
          return next;
        });
        this.alerts
          .open($localize`:@@cart.add.success:Producto agregado al carrito.`, { appearance: 'positive' })
          .subscribe();
      },
      error: (error: CartApiError) => {
        this.adding.update((set) => {
          const next = new Set(set);
          next.delete(product.id);
          return next;
        });
        this.alerts.open(error.message, { appearance: 'negative' }).subscribe();
      },
    });
  }
}
