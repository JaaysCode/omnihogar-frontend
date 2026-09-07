import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TuiButton, TuiIcon } from '@taiga-ui/core';
import { AdminSidebar } from '../../components/admin-sidebar/admin-sidebar';
import { AdminTabBar } from '../../components/admin-tab-bar/admin-tab-bar';
import { CopCurrencyPipe } from '../../../shared/pipes/cop-currency.pipe';
import { Product, ProductApiError } from '../../../domain/models/product.model';
import { ProductRepository } from '../../../domain/repositories/product.repository';

interface StatCard {
  readonly label: string;
  readonly value: string;
  readonly icon: string;
  readonly trend: string;
  readonly trendIcon: string;
  readonly variant?: 'warning';
}

interface ChannelSample {
  readonly label: string;
  readonly web: number;
  readonly store: number;
  readonly chatbot: number;
}

interface TeamMember {
  readonly initials: string;
  readonly name: string;
  readonly role: string;
}

const CHART_SCALE_MAX = 100_000;

/**
 * Admin operations dashboard — landing page for Admin-role logins (see AuthPage.postLoginUrl).
 * The stat cards, sales-by-channel chart and team-roles panel have no backing endpoint yet
 * (no sales/orders/HR APIs in this repo), so they render fixed mock data — same "shell ahead
 * of backend" approach as AdminSidebar's inert nav items. `Productos Recientes` is the one
 * panel wired to real data: it reuses ProductRepository.getAdminList(), the same call
 * AdminProductsPage and AdminInventoryPage already make.
 */
@Component({
  selector: 'app-admin-dashboard-page',
  imports: [AdminSidebar, AdminTabBar, RouterLink, TuiButton, TuiIcon, CopCurrencyPipe],
  templateUrl: './admin-dashboard-page.html',
  styleUrl: './admin-dashboard-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardPage implements OnInit {
  private readonly productRepository = inject(ProductRepository);

  protected readonly chartMax = CHART_SCALE_MAX;

  protected readonly statCards: readonly StatCard[] = [
    {
      label: $localize`:@@dashboard.stat.sales.label:Ventas Totales`,
      value: '$500.000.000',
      icon: '@tui.coins',
      trend: $localize`:@@dashboard.stat.sales.trend:+12.5% del mes pasado`,
      trendIcon: '@tui.trending-up',
    },
    {
      label: $localize`:@@dashboard.stat.orders.label:Pedidos Activos`,
      value: '3,421',
      icon: '@tui.shopping-bag',
      trend: $localize`:@@dashboard.stat.orders.trend:842 por empaquetar`,
      trendIcon: '@tui.circle-dot',
    },
    {
      label: $localize`:@@dashboard.stat.stock.label:Alertas de Stock Bajo`,
      value: $localize`:@@dashboard.stat.stock.value:18 items`,
      icon: '@tui.triangle-alert',
      trend: $localize`:@@dashboard.stat.stock.trend:Acción requerida de inmediato`,
      trendIcon: '@tui.triangle-alert',
      variant: 'warning',
    },
  ];

  protected readonly chartSeries: readonly ChannelSample[] = [
    { label: $localize`:@@dashboard.chart.day.mon:Lun`, web: 72_000, store: 32_000, chatbot: 18_000 },
    { label: $localize`:@@dashboard.chart.day.tue:Mar`, web: 58_000, store: 40_000, chatbot: 28_000 },
    { label: $localize`:@@dashboard.chart.day.wed:Mié`, web: 85_000, store: 35_000, chatbot: 20_000 },
    { label: $localize`:@@dashboard.chart.day.thu:Jue`, web: 68_000, store: 62_000, chatbot: 30_000 },
    { label: $localize`:@@dashboard.chart.day.fri:Vie`, web: 80_000, store: 65_000, chatbot: 40_000 },
  ];

  protected readonly teamMembers: readonly TeamMember[] = [
    { initials: 'SJ', name: 'Sarah Jenkins', role: $localize`:@@dashboard.team.role.admin:Admin` },
    { initials: 'MC', name: 'Marcus Chen', role: $localize`:@@dashboard.team.role.seller:Vendedor` },
    { initials: 'EL', name: 'Elena Rossi', role: $localize`:@@dashboard.team.role.warehouse:Almacén` },
  ];

  protected readonly allProducts = signal<Product[] | null>(null);
  protected readonly loadError = signal<string | null>(null);
  protected readonly searchTerm = signal('');

  /** Unfiltered: the 5 most recently returned admin products. Filtered: every match across
   * the full admin list, not just the recent slice — a search shouldn't hide older matches. */
  protected readonly displayedProducts = computed(() => {
    const products = this.allProducts();
    if (!products) {
      return [];
    }
    const term = this.searchTerm().trim().toLowerCase();
    if (term === '') {
      return products.slice(0, 5);
    }
    return products.filter(
      (product) => product.sku.toLowerCase().includes(term) || product.name.toLowerCase().includes(term),
    );
  });

  ngOnInit(): void {
    this.productRepository.getAdminList().subscribe({
      next: (products) => this.allProducts.set(products),
      error: (error: ProductApiError) => this.loadError.set(error.message),
    });
  }

  protected onSearchInput(value: string): void {
    this.searchTerm.set(value);
  }

  protected barHeight(value: number): string {
    return `${Math.min(100, (value / this.chartMax) * 100)}%`;
  }
}
