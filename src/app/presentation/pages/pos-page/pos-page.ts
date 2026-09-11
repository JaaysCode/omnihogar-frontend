import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { TuiAlertService, TuiButton, TuiIcon } from '@taiga-ui/core';
import { AdminSidebar } from '../../components/admin-sidebar/admin-sidebar';
import { AdminTabBar } from '../../components/admin-tab-bar/admin-tab-bar';
import { CopCurrencyPipe } from '../../../shared/pipes/cop-currency.pipe';
import { Product, ProductApiError } from '../../../domain/models/product.model';
import { OrderApiError, StoreSaleReceipt } from '../../../domain/models/order.model';
import { ProductRepository } from '../../../domain/repositories/product.repository';
import { OrderRepository } from '../../../domain/repositories/order.repository';

/** One product line in the current sale, with the quantity the cashier has added. */
interface CartLine {
  readonly product: Product;
  quantity: number;
}

type PaymentMethod = 'cash' | 'card' | 'transfer';

/** Colombia's IVA general rate — the only tax this register applies for now. */
const TAX_RATE = 0.19;

/**
 * Point of Sale (HU-06) — front-desk staff search the active catalog, build a cart, and close
 * the sale. `finalizeSale()` POSTs to `OrderRepository.registerStoreSale`, which creates a
 * `channel = 'store'` order and decrements inventory server-side; the backend is the real guard
 * against overselling (the `+` stepper here only mirrors known stock as an early warning).
 * `paymentMethod` stays UI-only — the `Payment` entity's allowed methods (card/pse/wallet) don't
 * cover cash/transfer, and recording it is out of scope for HU-06.
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
  private readonly orderRepository = inject(OrderRepository);
  private readonly alerts = inject(TuiAlertService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly catalog = signal<Product[] | null>(null);
  protected readonly loadError = signal<string | null>(null);

  protected readonly searchTerm = signal('');
  protected readonly cart = signal<CartLine[]>([]);
  protected readonly paymentMethod = signal<PaymentMethod>('cash');
  protected readonly receipt = signal<StoreSaleReceipt | null>(null);
  protected readonly pending = signal(false);
  protected readonly saleError = signal<string | null>(null);

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

  /** First page of the catalog, shown as quick-add tiles so the cashier isn't forced to search
   * for common products. Hidden while a search is in progress (the dropdown takes over). */
  protected readonly quickPicks = computed(() => this.catalog()?.slice(0, 10) ?? []);

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
    this.refreshCatalog();
  }

  /** Active products only — a POS shouldn't be able to ring up a discontinued item. Re-run
   * after every sale so `availableQuantity` (and the stock cap on the stepper) stays accurate
   * for the next one instead of trusting a page-load-old snapshot. */
  private refreshCatalog(): void {
    this.productRepository.getCatalog().subscribe({
      next: (products) => {
        this.catalog.set(products);
        // Also resync any line still in the cart, so its price/availableQuantity (and the
        // stepper's cap) reflect the fresh numbers without the cashier removing/re-adding it.
        const byId = new Map(products.map((p) => [p.id, p]));
        this.cart.update((lines) => lines.map((line) => ({ ...line, product: byId.get(line.product.id) ?? line.product })));
      },
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
        if (this.atStockLimit(existing)) {
          return lines;
        }
        return lines.map((line) => (line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line));
      }
      return [...lines, { product, quantity: 1 }];
    });
    this.searchTerm.set('');
  }

  protected incrementLine(productId: string): void {
    this.cart.update((lines) =>
      lines.map((line) =>
        line.product.id === productId && !this.atStockLimit(line) ? { ...line, quantity: line.quantity + 1 } : line,
      ),
    );
  }

  /** True once the line's quantity has reached known available stock — the "+" stops there. */
  protected atStockLimit(line: CartLine): boolean {
    const available = line.product.availableQuantity;
    return available !== null && line.quantity >= available;
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
    if (this.cart().length === 0 || this.pending()) {
      return;
    }

    this.pending.set(true);
    this.saleError.set(null);

    const items = this.cart().map((line) => ({ productId: line.product.id, quantity: line.quantity }));

    this.orderRepository.registerStoreSale(items).subscribe({
      next: (receipt) => {
        this.pending.set(false);
        this.receipt.set(receipt);
        this.cart.set([]);
        this.searchTerm.set('');
        this.refreshCatalog();
        this.alerts
          .open($localize`:@@pos.finalize.success:Venta registrada.`, { appearance: 'positive' })
          .subscribe();
      },
      error: (error: OrderApiError) => {
        this.pending.set(false);
        this.saleError.set(error.fieldErrors ? Object.values(error.fieldErrors)[0]?.[0] ?? error.message : error.message);
        // The stock that caused the rejection may already be stale in `catalog()` (e.g. another
        // register sold it in the meantime) — refresh so the stepper's cap is accurate on retry.
        this.refreshCatalog();
      },
    });
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
