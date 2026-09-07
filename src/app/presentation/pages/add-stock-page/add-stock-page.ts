import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { TuiIcon } from '@taiga-ui/core';
import { AddStockForm, AddStockSubmit } from '../../components/add-stock-form/add-stock-form';
import { FieldErrors, Product, ProductApiError } from '../../../domain/models/product.model';
import { ProductRepository } from '../../../domain/repositories/product.repository';

/**
 * Modal content for manually adding units to a product's stock (HU inventario — "Agregar
 * Unidades"). Rendered by admin-inventory-page inside an `@if` block driven by the `?addStock`
 * query param — same pattern as create-employee-page over admin-users-page: the table underneath
 * stays mounted and dimmed rather than being navigated away from.
 */
@Component({
  selector: 'app-add-stock-page',
  imports: [AddStockForm, TuiIcon],
  templateUrl: './add-stock-page.html',
  styleUrl: './add-stock-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddStockPage implements AfterViewInit, OnDestroy {
  private readonly productRepository = inject(ProductRepository);
  private readonly document = inject(DOCUMENT);

  @ViewChild('panel') private readonly panel?: ElementRef<HTMLElement>;

  /** Catalog to pick from — passed down from the already-loaded inventory table. */
  readonly products = input<Product[]>([]);
  /** Pre-selects the product dropdown — the row the user had expanded, if any. */
  readonly preselected = input<Product | null>(null);

  /** Emitted on cancel, backdrop click, Escape, or successful add — parent clears `?addStock`. */
  readonly closed = output<void>();

  protected readonly pending = signal(false);
  protected readonly fieldErrors = signal<FieldErrors | null>(null);
  protected readonly formError = signal<string | null>(null);

  constructor() {
    // Lock background scroll while the modal is open; restored in ngOnDestroy.
    this.document.body.style.overflow = 'hidden';
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

  protected onSubmit({ productId, payload }: AddStockSubmit): void {
    this.pending.set(true);
    this.fieldErrors.set(null);
    this.formError.set(null);

    this.productRepository.addStock(productId, payload).subscribe({
      next: () => this.closed.emit(),
      error: (error: ProductApiError) => {
        this.pending.set(false);
        this.fieldErrors.set(error.fieldErrors ?? null);
        this.formError.set(error.fieldErrors ? null : error.message);
      },
    });
  }
}
