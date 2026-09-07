import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TuiButton, TuiIcon } from '@taiga-ui/core';
import { AdminSidebar } from '../../components/admin-sidebar/admin-sidebar';
import { AdminTabBar } from '../../components/admin-tab-bar/admin-tab-bar';
import { CopCurrencyPipe } from '../../../shared/pipes/cop-currency.pipe';
import { CreateProductPage } from '../create-product-page/create-product-page';
import { EditProductPage } from '../edit-product-page/edit-product-page';
import { Product, ProductApiError, ProductStock } from '../../../domain/models/product.model';
import { ProductRepository } from '../../../domain/repositories/product.repository';

/**
 * Admin-only product management list (HU-10). "Nuevo Producto" opens create-product-page and
 * row-level "Editar" opens edit-product-page, both as modals driven by `?create`/`?edit` query
 * params (bound via withComponentInputBinding) instead of navigating away from the list — see the
 * `@if`/`@defer` blocks in the template.
 */
@Component({
  selector: 'app-admin-products-page',
  imports: [RouterLink, AdminSidebar, AdminTabBar, CreateProductPage, EditProductPage, TuiButton, TuiIcon, CopCurrencyPipe],
  templateUrl: './admin-products-page.html',
  styleUrl: './admin-products-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminProductsPage implements OnInit {
  private readonly productRepository = inject(ProductRepository);
  private readonly router = inject(Router);

  /** Bound from the `?create` query param by withComponentInputBinding (see app.config.ts). */
  readonly create = input<string | undefined>(undefined);

  /** Bound from the `?edit` query param (holds the product id) by withComponentInputBinding. */
  readonly edit = input<string | undefined>(undefined);

  protected readonly products = signal<Product[] | null>(null);
  protected readonly loadError = signal<string | null>(null);

  /** Same placeholder cutoff as admin-inventory-page — no real "low stock" business rule yet. */
  protected readonly lowStockThreshold = 15;

  /** Per-product stock, filled in as each row's GET /products/{id}/stock resolves — there's no
   * bulk-stock endpoint, so the Stock column fans out one request per row on load, same pattern
   * as admin-inventory-page. A row stays "—" (title carries the error) if its request fails. */
  protected readonly rowStock = signal<ReadonlyMap<string, ProductStock>>(new Map());
  protected readonly rowStockError = signal<ReadonlyMap<string, string>>(new Map());

  ngOnInit(): void {
    this.loadProducts();
  }

  /** Also re-run when the create/edit modal closes, so a just-created/-edited product shows up. */
  protected loadProducts(): void {
    this.productRepository.getAdminList().subscribe({
      next: (products) => {
        this.products.set(products);
        for (const product of products) {
          this.loadRowStock(product.id);
        }
      },
      error: (error: ProductApiError) => this.loadError.set(error.message),
    });
  }

  private loadRowStock(productId: string): void {
    this.productRepository.getStock(productId).subscribe({
      next: (stock) => this.rowStock.update((cache) => new Map(cache).set(productId, stock)),
      error: (error: ProductApiError) =>
        this.rowStockError.update((cache) => new Map(cache).set(productId, error.message)),
    });
  }

  protected onModalClosed(): void {
    // Plain absolute navigate with no queryParams — matches ProductForm's "Cancelar" link.
    // `queryParamsHandling: 'merge'` + `{ create: null }` is unreliable for stripping a param:
    // if it doesn't actually drop it, this resolves to the URL we're already on, and the router's
    // default `onSameUrlNavigation: 'ignore'` silently no-ops (no NavigationEnd, `create()` never
    // flips back, modal never closes).
    void this.router.navigate(['/admin/products']);
    this.loadProducts();
  }
}
