import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ProductForm } from '../../components/product-form/product-form';
import { CreateProductPayload, FieldErrors, ProductApiError, UpdateProductPayload } from '../../../domain/models/product.model';
import { ProductRepository } from '../../../domain/repositories/product.repository';

/** Admin-only page for creating a product (HU-10). */
@Component({
  selector: 'app-create-product-page',
  imports: [RouterLink, ProductForm],
  templateUrl: './create-product-page.html',
  styleUrl: './create-product-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateProductPage {
  private readonly productRepository = inject(ProductRepository);
  private readonly router = inject(Router);

  protected readonly pending = signal(false);
  protected readonly fieldErrors = signal<FieldErrors | null>(null);
  protected readonly formError = signal<string | null>(null);

  protected onSubmit(payload: CreateProductPayload | UpdateProductPayload): void {
    this.pending.set(true);
    this.fieldErrors.set(null);
    this.formError.set(null);

    this.productRepository.create(payload as CreateProductPayload).subscribe({
      next: () => void this.router.navigateByUrl('/admin/products'),
      error: (error: ProductApiError) => {
        this.pending.set(false);
        this.fieldErrors.set(error.fieldErrors ?? null);
        this.formError.set(error.fieldErrors ? null : error.message);
      },
    });
  }
}
