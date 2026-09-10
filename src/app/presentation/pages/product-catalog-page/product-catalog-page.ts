import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Product, ProductApiError } from '../../../domain/models/product.model';
import { ProductRepository } from '../../../domain/repositories/product.repository';
import { CopCurrencyPipe } from '../../../shared/pipes/cop-currency.pipe';
import { PublicHeader } from '../../components/public-header/public-header';

/** Public product catalog (HU-4) — every customer, no auth required. */
@Component({
  selector: 'app-product-catalog-page',
  imports: [CopCurrencyPipe, PublicHeader],
  templateUrl: './product-catalog-page.html',
  styleUrl: './product-catalog-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCatalogPage implements OnInit {
  private readonly productRepository = inject(ProductRepository);

  protected readonly products = signal<Product[] | null>(null);
  protected readonly loadError = signal<string | null>(null);

  ngOnInit(): void {
    this.productRepository.getCatalog().subscribe({
      next: (products) => this.products.set(products),
      error: (error: ProductApiError) => this.loadError.set(error.message),
    });
  }
}
