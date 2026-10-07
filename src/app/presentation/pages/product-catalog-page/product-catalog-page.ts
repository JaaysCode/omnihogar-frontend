import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TuiButton, TuiAlertService, TuiIcon } from '@taiga-ui/core';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { Category, Product, ProductApiError } from '../../../domain/models/product.model';
import { CartApiError } from '../../../domain/models/cart.model';
import { ProductRepository } from '../../../domain/repositories/product.repository';
import { CartStore } from '../../../core/services/cart-store.service';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { CopCurrencyPipe } from '../../../shared/pipes/cop-currency.pipe';
import { PublicHeader } from '../../components/public-header/public-header';

/** Debounce for the name search box, so we don't fire a request on every keystroke. */
const SEARCH_DEBOUNCE_MS = 300;

interface SearchCriteria {
  readonly name: string | null;
  readonly categoryId: string | null;
}

/**
 * Public product catalog (HU-4) — every customer, no auth required. "Agregar al carrito" (HU-05).
 * Search by name and/or category filters the catalog via the backend's `/products/search`
 * endpoint (HU-17).
 */
@Component({
  selector: 'app-product-catalog-page',
  imports: [CopCurrencyPipe, PublicHeader, TuiButton, RouterLink, TuiIcon],
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
  protected readonly categories = signal<Category[]>([]);
  protected readonly searchTerm = signal('');
  protected readonly selectedCategoryId = signal<string | null>(null);
  /** Orden aplicado a los resultados ya cargados (no vuelve al servidor). */
  protected readonly sortOrder = signal<'name' | 'price-asc' | 'price-desc'>('name');
  protected readonly hasFilters = computed(() => !!this.searchTerm().trim() || this.selectedCategoryId() !== null);
  /** Resultados ordenados. Se copia antes de ordenar para no mutar la lista del servidor. */
  protected readonly sortedProducts = computed(() => {
    const list = [...(this.products() ?? [])];
    switch (this.sortOrder()) {
      case 'price-asc':
        return list.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return list.sort((a, b) => b.price - a.price);
      default:
        return list.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    }
  });
  /** Product ids with an in-flight add request, to disable the button meanwhile. */
  protected readonly adding = signal<ReadonlySet<string>>(new Set());

  private readonly criteria$ = new Subject<SearchCriteria>();

  ngOnInit(): void {
    this.criteria$
      .pipe(
        debounceTime(SEARCH_DEBOUNCE_MS),
        distinctUntilChanged((a, b) => a.name === b.name && a.categoryId === b.categoryId),
        switchMap(({ name, categoryId }) => this.productRepository.search(name, categoryId)),
      )
      .subscribe({
        next: (products) => {
          this.products.set(products);
          this.loadError.set(null);
        },
        error: (error: ProductApiError) => this.loadError.set(error.message),
      });

    this.criteria$.next({ name: null, categoryId: null });
    this.productRepository.getCategories().subscribe({
      next: (categories) => this.categories.set(categories),
      // Category catalog is a nice-to-have filter; if it fails to load, search by name still works.
      error: () => this.categories.set([]),
    });
    this.cartStore.load();
  }

  protected onSearchInput(value: string): void {
    this.searchTerm.set(value);
    this.emitCriteria();
  }

  protected onCategoryChange(categoryId: string): void {
    this.selectedCategoryId.set(categoryId || null);
    this.emitCriteria();
  }

  protected onSortChange(value: string): void {
    this.sortOrder.set(value as 'name' | 'price-asc' | 'price-desc');
  }

  protected onClearFilters(): void {
    this.searchTerm.set('');
    this.selectedCategoryId.set(null);
    this.emitCriteria();
  }

  private emitCriteria(): void {
    const name = this.searchTerm().trim();
    this.criteria$.next({ name: name || null, categoryId: this.selectedCategoryId() });
  }

  protected onAddToCart(product: Product): void {
    // Belt-and-suspenders against a double-click: the `[disabled]` binding can lag one render
    // frame behind two clicks fired back-to-back, which used to fire two concurrent POSTs and
    // occasionally 500 on the backend (both requests read the same cart line before either
    // saved). Bail out here too, synchronously, before either request goes out.
    if (this.adding().has(product.id)) {
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
