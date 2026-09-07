import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { TuiIcon } from '@taiga-ui/core';
import { ProductForm } from '../../components/product-form/product-form';
import {
  Category,
  CreateProductPayload,
  FieldErrors,
  Product,
  ProductApiError,
  UpdateProductPayload,
} from '../../../domain/models/product.model';
import { ProductRepository } from '../../../domain/repositories/product.repository';

/**
 * Modal content for editing an existing product (HU-10). Rendered by admin-products-page inside
 * an `@if`/`@defer` block driven by the `?edit` query param — same modal shell/backdrop/Escape/
 * focus pattern as create-product-page, so editing no longer navigates away from the list.
 */
@Component({
  selector: 'app-edit-product-page',
  imports: [ProductForm, TuiIcon],
  templateUrl: './edit-product-page.html',
  styleUrl: './edit-product-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditProductPage implements OnInit, AfterViewInit, OnDestroy {
  private readonly productRepository = inject(ProductRepository);
  private readonly document = inject(DOCUMENT);

  /** Product id to load — required, set from the parent's `?edit` query param. */
  readonly productId = input.required<string>();

  /** Emitted on close button, backdrop click, Escape, or successful update — parent clears `?edit`. */
  readonly closed = output<void>();

  @ViewChild('panel') private readonly panel?: ElementRef<HTMLElement>;

  protected readonly product = signal<Product | null>(null);
  protected readonly categories = signal<Category[]>([]);
  protected readonly loadError = signal<string | null>(null);
  protected readonly pending = signal(false);
  protected readonly fieldErrors = signal<FieldErrors | null>(null);
  protected readonly formError = signal<string | null>(null);

  constructor() {
    // Lock background scroll while the modal is open; restored in ngOnDestroy.
    this.document.body.style.overflow = 'hidden';
  }

  ngOnInit(): void {
    this.productRepository.getCategories().subscribe({
      next: (categories) => this.categories.set(categories),
      // Non-fatal: the select just renders empty until this resolves/retries.
      error: () => this.categories.set([]),
    });

    this.productRepository.getById(this.productId()).subscribe({
      next: (product) => this.product.set(product),
      error: (error: ProductApiError) => this.loadError.set(error.message),
    });
  }

  ngAfterViewInit(): void {
    // Move focus into the dialog so screen readers announce it and Tab stays sensible.
    this.panel?.nativeElement.focus();
  }

  ngOnDestroy(): void {
    this.document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  protected close(): void {
    this.closed.emit();
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
      next: () => this.closed.emit(),
      error: (error: ProductApiError) => {
        this.pending.set(false);
        this.fieldErrors.set(error.fieldErrors ?? null);
        this.formError.set(error.fieldErrors ? null : error.message);
      },
    });
  }
}
