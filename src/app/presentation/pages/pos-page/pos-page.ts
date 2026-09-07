import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { TuiButton, TuiIcon } from '@taiga-ui/core';
import { AdminSidebar } from '../../components/admin-sidebar/admin-sidebar';
import { AdminTabBar } from '../../components/admin-tab-bar/admin-tab-bar';
import { CopCurrencyPipe } from '../../../shared/pipes/cop-currency.pipe';
import { Product, ProductApiError } from '../../../domain/models/product.model';
import { ProductRepository } from '../../../domain/repositories/product.repository';

/** One product line in the current sale, with the quantity the cashier has added. */
interface CartLine {
  readonly product: Product;
  quantity: number;
}

type PaymentMethod = 'cash' | 'card' | 'transfer';

/** Colombia's IVA general rate — the only tax this register applies for now. */
const TAX_RATE = 0.19;

/**
 * Point of Sale (HU) — front-desk staff search the active catalog, build a cart, and close the
 * sale. There is no Sales/Orders API on the backend yet (only the `Order`/`OrderItem` domain
 * entities exist, unwired to any controller), so `finalizeSale()` is a local-only checkout: it
 * renders a receipt summary and clears the cart instead of POSTing anywhere. Swap that method's
 * body for a real `SalesRepository.create(...)` call once that endpoint exists — the cart/total
 * computation above it is already what such a payload would need.
 */
@Component({
  selector: 'app-pos-page',
  imports: [AdminSidebar, AdminTabBar, TuiButton, TuiIcon, CopCurrencyPipe],
  templateUrl: './pos-page.html',
  styleUrl: './pos-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PosPage implements OnInit {
  private readonly productRepository = inject(ProductRepository);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly catalog = signal<Product[] | null>(null);
  protected readonly loadError = signal<string | null>(null);

  protected readonly searchTerm = signal('');
  protected readonly cart = signal<CartLine[]>([]);
  protected readonly paymentMethod = signal<PaymentMethod>('cash');
  protected readonly receipt = signal<{ total: number; method: PaymentMethod } | null>(null);

  /** Elapsed time since the register was opened (this page loaded) — mm:ss, ticking live. */
  protected readonly elapsed = signal(0);

  protected readonly searchResults = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const products = this.catalog();
    if (!term || !products) {
      return [];
    }
    return products
      .filter((p) => p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term))
      .slice(0, 8);
  });

  protected readonly itemCount = computed(() => this.cart().reduce((sum, line) => sum + line.quantity, 0));
  protected readonly subtotal = computed(() =>
    this.cart().reduce((sum, line) => sum + line.product.price * line.quantity, 0),
  );
  protected readonly tax = computed(() => this.subtotal() * TAX_RATE);
  protected readonly total = computed(() => this.subtotal() + this.tax());

  constructor() {
    const id = setInterval(() => this.elapsed.update((s) => s + 1), 1000);
    this.destroyRef.onDestroy(() => clearInterval(id));
  }

  ngOnInit(): void {
    // Active products only — a POS shouldn't be able to ring up a discontinued item.
    this.productRepository.getCatalog().subscribe({
      next: (products) => this.catalog.set(products),
      error: (error: ProductApiError) => this.loadError.set(error.message),
    });
  }

  protected onSearchInput(value: string): void {
    this.searchTerm.set(value);
  }

  protected addToCart(product: Product): void {
    this.cart.update((lines) => {
      const existing = lines.find((line) => line.product.id === product.id);
      if (existing) {
        return lines.map((line) => (line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line));
      }
      return [...lines, { product, quantity: 1 }];
    });
    this.searchTerm.set('');
  }

  protected incrementLine(productId: string): void {
    this.cart.update((lines) =>
      lines.map((line) => (line.product.id === productId ? { ...line, quantity: line.quantity + 1 } : line)),
    );
  }

  protected decrementLine(productId: string): void {
    this.cart.update((lines) =>
      lines
        .map((line) => (line.product.id === productId ? { ...line, quantity: line.quantity - 1 } : line))
        .filter((line) => line.quantity > 0),
    );
  }

  protected removeLine(productId: string): void {
    this.cart.update((lines) => lines.filter((line) => line.product.id !== productId));
  }

  protected selectPaymentMethod(method: PaymentMethod): void {
    this.paymentMethod.set(method);
  }

  protected finalizeSale(): void {
    if (this.cart().length === 0) {
      return;
    }
    // No Sales/Orders endpoint to POST to yet — see class doc comment. Show the closed-sale
    // receipt locally and reset the register for the next customer.
    this.receipt.set({ total: this.total(), method: this.paymentMethod() });
    this.cart.set([]);
    this.searchTerm.set('');
  }

  protected dismissReceipt(): void {
    this.receipt.set(null);
  }

  protected formatElapsed(): string {
    const minutes = Math.floor(this.elapsed() / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (this.elapsed() % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }
}
