import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TuiButton, TuiIcon } from '@taiga-ui/core';
import { AdminSidebar } from '../../components/admin-sidebar/admin-sidebar';
import { AdminTabBar } from '../../components/admin-tab-bar/admin-tab-bar';
import { CopCurrencyPipe } from '../../../shared/pipes/cop-currency.pipe';
import { CreateProductPage } from '../create-product-page/create-product-page';
import { EditProductPage } from '../edit-product-page/edit-product-page';
import { Category, Product, ProductApiError, ProductStock } from '../../../domain/models/product.model';
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
  protected readonly categories = signal<Category[]>([]);
  /** categoryId -> name, for the table's "Categoría" column (the admin list DTO only carries
   * `categoryId`, not the name — see `ProductDto` on the backend). */
  protected readonly categoryNameById = computed(() => new Map(this.categories().map((c) => [c.id, c.name])));

  /** Same placeholder cutoff as admin-inventory-page — no real "low stock" business rule yet. */
  protected readonly lowStockThreshold = 15;

  /** Per-product stock, filled in with one GET /products/stock?ids=... batch call once the
   * catalog loads, keyed by product id. `rowStockError` carries a page-level message if that
   * single request fails — rows just render "—" rather than each row erroring separately. */
  protected readonly rowStock = signal<ReadonlyMap<string, ProductStock>>(new Map());
  protected readonly rowStockError = signal<string | null>(null);

  ngOnInit(): void {
    this.loadProducts();
    this.productRepository.getCategories().subscribe({
      next: (categories) => this.categories.set(categories),
      error: () => this.categories.set([]),
    });
  }

  /** Also re-run when the create/edit modal closes, so a just-created/-edited product shows up. */
  protected loadProducts(): void {
    this.productRepository.getAdminList().subscribe({
      next: (products) => {
        this.products.set(products);
        this.loadRowStock(products.map((product) => product.id));
      },
      error: (error: ProductApiError) => this.loadError.set(error.message),
    });
  }

  private loadRowStock(productIds: readonly string[]): void {
    this.productRepository.getStockBatch(productIds).subscribe({
      next: (stocks) => {
        this.rowStock.set(new Map(stocks.map((stock) => [stock.productId, stock])));
        this.rowStockError.set(null);
      },
      error: (error: ProductApiError) => this.rowStockError.set(error.message),
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
