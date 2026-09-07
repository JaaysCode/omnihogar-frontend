import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TuiButton, TuiIcon } from '@taiga-ui/core';
import { AdminSidebar } from '../../components/admin-sidebar/admin-sidebar';
import { AdminTabBar } from '../../components/admin-tab-bar/admin-tab-bar';
import { AddStockPage } from '../add-stock-page/add-stock-page';
import { Product, ProductApiError, ProductStock } from '../../../domain/models/product.model';
import { ProductRepository } from '../../../domain/repositories/product.repository';

/**
 * Admin inventory lookup (HU consulta de stock). Loads the admin product list once and renders
 * it as a table right away (empty search = full catalog), then filters client-side as the user
 * types — searching a SKU/name that matches nothing is exactly AC "Producto inexistente" (no
 * round trip needed, we already hold the full catalog).
 *
 * The Estado column needs every row's status up front (not just the one being inspected), so as
 * soon as the catalog loads we fan out one GET /products/{id}/stock per product in parallel and
 * cache each result in `rowStock` as it resolves — there's no bulk-stock endpoint, so this is
 * the only way to fill every pill without waiting on a row click. Expanding a row (AC "Consulta
 * de stock" / "Producto por tienda") reads the same cache for the per-facility breakdown rather
 * than firing a second request; a 0-total response renders the "Producto sin stock" state (AC
 * "Producto sin stock").
 *
 * "Agregar Unidades" opens add-stock-page as a `?addStock` query-param-driven modal on top of
 * this page — same pattern as create-employee-page over admin-users-page — and reloads the
 * catalog/stock on close so the row the user just restocked reflects the new total.
 */
@Component({
  selector: 'app-admin-inventory-page',
  imports: [RouterLink, AdminSidebar, AdminTabBar, AddStockPage, TuiIcon, TuiButton],
  templateUrl: './admin-inventory-page.html',
  styleUrl: './admin-inventory-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminInventoryPage implements OnInit {
  private readonly productRepository = inject(ProductRepository);
  private readonly router = inject(Router);

  /** Bound from the `?addStock` query param by withComponentInputBinding (see app.config.ts). */
  readonly addStock = input<string | undefined>(undefined);

  /**
   * Placeholder cutoff for the "Stock Bajo" pill — no backend threshold exists yet (the API
   * only returns a total + per-facility quantities). Presentational stand-in until a real
   * business rule lands; swap for whatever the eventual HU defines.
   */
  protected readonly lowStockThreshold = 15;

  protected readonly allProducts = signal<Product[] | null>(null);
  protected readonly loadError = signal<string | null>(null);

  protected readonly searchTerm = signal('');
  protected readonly selectedProduct = signal<Product | null>(null);

  /** Per-product stock, filled in as each row's request resolves — see class doc. */
  protected readonly rowStock = signal<ReadonlyMap<string, ProductStock>>(new Map());
  protected readonly rowError = signal<ReadonlyMap<string, string>>(new Map());

  protected readonly filteredProducts = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const products = this.allProducts();
    if (!products) {
      return [];
    }
    if (term === '') {
      return products;
    }
    return products.filter(
      (product) => product.sku.toLowerCase().includes(term) || product.name.toLowerCase().includes(term),
    );
  });

  /** True once the user has typed something but no product in the catalog matches it. */
  protected readonly noMatches = computed(
    () => this.searchTerm().trim() !== '' && this.allProducts() !== null && this.filteredProducts().length === 0,
  );

  ngOnInit(): void {
    this.loadProducts();
  }

  /** Also re-run when the "Agregar Unidades" modal closes, so a just-added row's total refreshes. */
  private loadProducts(): void {
    this.productRepository.getAdminList().subscribe({
      next: (products) => {
        this.allProducts.set(products);
        for (const product of products) {
          this.loadRowStock(product.id);
        }
      },
      error: (error: ProductApiError) => this.loadError.set(error.message),
    });
  }

  protected onSearchInput(value: string): void {
    this.searchTerm.set(value);
    this.selectedProduct.set(null);
  }

  protected selectProduct(product: Product): void {
    this.selectedProduct.update((current) => (current?.id === product.id ? null : product));
  }

  protected onStockModalClosed(): void {
    // Plain absolute navigate with no queryParams — matches admin-products-page's onModalClosed.
    void this.router.navigate(['/admin/inventory']);
    this.loadProducts();
  }

  private loadRowStock(productId: string): void {
    this.productRepository.getStock(productId).subscribe({
      next: (stock) => this.rowStock.update((cache) => new Map(cache).set(productId, stock)),
      error: (error: ProductApiError) =>
        this.rowError.update((cache) => new Map(cache).set(productId, error.message)),
    });
  }
}
