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
  output,
  signal,
} from '@angular/core';
import { TuiAlertService, TuiButton, TuiIcon } from '@taiga-ui/core';
import { ProductForm } from '../../components/product-form/product-form';
import {
  Category,
  CreateProductPayload,
  FieldErrors,
  ProductApiError,
  UpdateProductPayload,
} from '../../../domain/models/product.model';
import { ProductRepository } from '../../../domain/repositories/product.repository';

type EntryMode = 'manual' | 'batch';

/**
 * Modal content for creating a product (HU-10). Rendered by admin-products-page inside an
 * `@if`/`@defer` block driven by the `?create` query param — the list underneath stays mounted and
 * dimmed rather than being navigated away from. "Ingreso Manual" is the real, wired-up form (see
 * ProductForm); "Ingreso por Lote" is presentational only — there's no bulk-import endpoint
 * (ProductRepository only exposes single create()), so the whole tab renders inert, matching the
 * convention used elsewhere.
 */
@Component({
  selector: 'app-create-product-page',
  imports: [ProductForm, TuiIcon, TuiButton],
  templateUrl: './create-product-page.html',
  styleUrl: './create-product-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateProductPage implements OnInit, AfterViewInit, OnDestroy {
  private readonly productRepository = inject(ProductRepository);
  private readonly document = inject(DOCUMENT);
  private readonly alerts = inject(TuiAlertService);

  @ViewChild('panel') private readonly panel?: ElementRef<HTMLElement>;

  /** Emitted on cancel, backdrop click, Escape, or successful create — parent clears `?new`. */
  readonly closed = output<void>();

  protected readonly entryMode = signal<EntryMode>('manual');

  protected readonly categories = signal<Category[]>([]);
  protected readonly categoriesError = signal<string | null>(null);

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
      error: (error: ProductApiError) => this.categoriesError.set(error.message),
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

  protected setEntryMode(mode: EntryMode): void {
    this.entryMode.set(mode);
  }

  protected onSubmit(payload: CreateProductPayload | UpdateProductPayload): void {
    this.pending.set(true);
    this.fieldErrors.set(null);
    this.formError.set(null);

    this.productRepository.create(payload as CreateProductPayload).subscribe({
      next: () => {
        this.alerts
          .open($localize`:@@products.create.success:Producto creado.`, { appearance: 'positive' })
          .subscribe();
        this.closed.emit();
      },
      error: (error: ProductApiError) => {
        this.pending.set(false);
        this.fieldErrors.set(error.fieldErrors ?? null);
        this.formError.set(error.fieldErrors ? null : error.message);
      },
    });
  }
}
