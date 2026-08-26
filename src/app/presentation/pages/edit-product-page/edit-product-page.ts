import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductForm } from '../../components/product-form/product-form';
import { CreateProductPayload, FieldErrors, Product, ProductApiError, UpdateProductPayload } from '../../../domain/models/product.model';
import { ProductRepository } from '../../../domain/repositories/product.repository';

/** Admin-only page for editing an existing product (HU-10). */
@Component({
  selector: 'app-edit-product-page',
  imports: [RouterLink, ProductForm],
  templateUrl: './edit-product-page.html',
  styleUrl: './edit-product-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditProductPage implements OnInit {
  private readonly productRepository = inject(ProductRepository);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly product = signal<Product | null>(null);
  protected readonly loadError = signal<string | null>(null);
  protected readonly pending = signal(false);
  protected readonly fieldErrors = signal<FieldErrors | null>(null);
  protected readonly formError = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loadError.set($localize`:@@products.edit.error.missingId:No se especificó un producto.`);
      return;
    }

    this.productRepository.getById(id).subscribe({
      next: (product) => this.product.set(product),
      error: (error: ProductApiError) => this.loadError.set(error.message),
    });
  }

  protected onSubmit(payload: CreateProductPayload | UpdateProductPayload): void {
    const current = this.product();
    if (!current) {
      return;
    }

    this.pending.set(true);
    this.fieldErrors.set(null);
    this.formError.set(null);

    this.productRepository.update(current.id, payload as UpdateProductPayload).subscribe({
      next: () => void this.router.navigateByUrl('/admin/products'),
      error: (error: ProductApiError) => {
        this.pending.set(false);
        this.fieldErrors.set(error.fieldErrors ?? null);
        this.formError.set(error.fieldErrors ? null : error.message);
      },
    });
  }
}
