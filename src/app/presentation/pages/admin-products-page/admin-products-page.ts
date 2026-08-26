import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TuiButton } from '@taiga-ui/core';
import { Product, ProductApiError } from '../../../domain/models/product.model';
import { ProductRepository } from '../../../domain/repositories/product.repository';

/** Admin-only product management list (HU-10) — entry point to create/edit. */
@Component({
  selector: 'app-admin-products-page',
  imports: [RouterLink, TuiButton],
  templateUrl: './admin-products-page.html',
  styleUrl: './admin-products-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminProductsPage implements OnInit {
  private readonly productRepository = inject(ProductRepository);

  protected readonly products = signal<Product[] | null>(null);
  protected readonly loadError = signal<string | null>(null);

  ngOnInit(): void {
    this.productRepository.getAdminList().subscribe({
      next: (products) => this.products.set(products),
      error: (error: ProductApiError) => this.loadError.set(error.message),
    });
  }
}
