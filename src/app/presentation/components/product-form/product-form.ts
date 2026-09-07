import { ChangeDetectionStrategy, Component, ElementRef, computed, effect, input, output, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TuiButton, TuiDataList, TuiDropdown, TuiIcon } from '@taiga-ui/core';
import { TuiChevron } from '@taiga-ui/kit';
import {
  Category,
  CreateProductPayload,
  FieldErrors,
  Product,
  ProductStatus,
  UpdateProductPayload,
} from '../../../domain/models/product.model';
import { firstErrorMessage } from '../../../shared/utils/form-error-messages';

interface FieldSpec {
  readonly control: string;
  readonly label: string;
}

const FIELDS: readonly FieldSpec[] = [
  { control: 'sku', label: $localize`:@@products.form.field.sku.name:SKU` },
  { control: 'name', label: $localize`:@@products.form.field.name.name:Nombre` },
  { control: 'price', label: $localize`:@@products.form.field.price.name:Precio` },
  { control: 'imageUrl', label: $localize`:@@products.form.field.imageUrl.name:URL de imagen` },
  { control: 'initialStock', label: $localize`:@@products.form.field.stock.name:Stock Inicial` },
];

const STATUS_LABELS: Record<ProductStatus, string> = {
  active: $localize`:@@products.form.field.status.active:Activo`,
  discontinued: $localize`:@@products.form.field.status.discontinued:Descontinuado`,
};

@Component({
  selector: 'app-product-form',
  imports: [ReactiveFormsModule, RouterLink, TuiButton, TuiIcon, TuiDropdown, TuiDataList, TuiChevron],
  templateUrl: './product-form.html',
  styleUrl: './product-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductForm {
  /** When set, the form pre-fills and submits an update for this product; otherwise a create. */
  readonly initial = input<Product | null>(null);
  /** Category catalog for the "Categoría" select — fetched by the page, passed down. */
  readonly categories = input<Category[]>([]);
  /** Server-side field errors from a failed submit (e.g. duplicate SKU), keyed camelCase. */
  readonly fieldErrors = input<FieldErrors | null>(null);
  readonly pending = input(false);

  readonly submitted = output<CreateProductPayload | UpdateProductPayload>();

  protected readonly isEdit = computed(() => this.initial() !== null);

  private readonly errorSummary = viewChild<ElementRef<HTMLElement>>('errorSummary');
  private readonly fb = new FormBuilder().nonNullable;

  protected attemptedSubmit = false;

  protected readonly categoryPlaceholder = $localize`:@@products.form.field.category.placeholder:Selecciona una categoría…`;
  protected readonly statusOptions: readonly ProductStatus[] = ['active', 'discontinued'];
  protected readonly statusLabel = (status: ProductStatus): string => STATUS_LABELS[status];

  protected readonly categoryMenuOpen = signal(false);
  protected readonly statusMenuOpen = signal(false);

  protected readonly form = this.fb.group({
    sku: this.fb.control('', [Validators.required, Validators.maxLength(20)]),
    name: this.fb.control('', [Validators.required, Validators.maxLength(150)]),
    description: this.fb.control(''),
    // Holds the selected `Category` object (not just its id) — set from the dropdown's
    // `onSelectCategory` below. Unwrapped to `.id` in `onSubmit`.
    categoryId: this.fb.control<Category | null>(null),
    price: this.fb.control(0, [Validators.required, Validators.min(0)]),
    imageUrl: this.fb.control(''),
    status: this.fb.control<ProductStatus>('active'),
    // Create-only — see the template's `@if (!isEdit())`. Kept in the same group for simplicity;
    // onSubmit strips it out of the payload when editing.
    initialStock: this.fb.control(0, [Validators.min(0)]),
  });

  // Read reactively for the trigger buttons' labels — `toSignal` keeps these in sync with the
  // controls' values regardless of whether they changed via the dropdown or (edit prefill) `patchValue`.
  protected readonly selectedCategory = toSignal(this.form.controls.categoryId.valueChanges, {
    initialValue: this.form.controls.categoryId.value,
  });
  private readonly selectedStatus = toSignal(this.form.controls.status.valueChanges, {
    initialValue: this.form.controls.status.value,
  });

  protected readonly categoryButtonLabel = computed(() => this.selectedCategory()?.name ?? this.categoryPlaceholder);
  protected readonly statusButtonLabel = computed(() => this.statusLabel(this.selectedStatus()));

  constructor() {
    // Prefill when editing — `initial` and `categories` both arrive async (separate fetches by
    // the parent page) and in no guaranteed order. Reading both signals here means this reruns
    // once whichever arrives second lands, so the category select ends up correctly matched even
    // if `initial` resolves before the category catalog does.
    effect(() => {
      const product = this.initial();
      if (!product) {
        return;
      }
      const category = this.categories().find((c) => c.id === product.categoryId) ?? null;
      this.form.patchValue({
        sku: product.sku,
        name: product.name,
        description: product.description ?? '',
        categoryId: category,
        price: product.price,
        imageUrl: product.imageUrl ?? '',
        status: product.status,
      });
    });

    // Merge server-side errors (e.g. "duplicate SKU") into the matching control, and clear
    // them the moment the user edits the field again.
    effect(() => {
      const errors = this.fieldErrors();
      if (!errors) {
        return;
      }
      for (const [field, messages] of Object.entries(errors)) {
        const control = this.form.get(field);
        if (control && messages.length > 0) {
          control.setErrors({ ...control.errors, server: messages[0] });
          control.markAsTouched();
        }
      }
    });

    for (const { control } of FIELDS) {
      this.form.get(control)?.valueChanges.subscribe(() => {
        const c = this.form.get(control);
        if (c?.errors?.['server']) {
          const rest = { ...c.errors };
          delete rest['server'];
          c.setErrors(Object.keys(rest).length > 0 ? rest : null);
        }
      });
    }
  }

  protected fieldLabel(control: string): string {
    return FIELDS.find((f) => f.control === control)?.label ?? control;
  }

  protected errorFor(control: string): string | null {
    const c = this.form.get(control);
    if (!c || !(c.touched || this.attemptedSubmit)) {
      return null;
    }
    return firstErrorMessage(this.fieldLabel(control), c.errors);
  }

  protected get invalidFieldSummary(): { control: string; label: string; message: string }[] {
    return FIELDS.filter(({ control }) => this.form.get(control)?.invalid).map(({ control, label }) => ({
      control,
      label,
      message:
        firstErrorMessage(label, this.form.get(control)?.errors) ??
        $localize`:@@products.form.error.summaryFallback:${label}:label: no es válido.`,
    }));
  }

  protected focusField(control: string): void {
    const element = document.getElementById(`product-form-${control}`);
    element?.focus();
  }

  protected onSelectCategory(category: Category): void {
    this.form.controls.categoryId.setValue(category);
    this.categoryMenuOpen.set(false);
  }

  protected onSelectStatus(status: ProductStatus): void {
    this.form.controls.status.setValue(status);
    this.statusMenuOpen.set(false);
  }

  protected onSubmit(): void {
    this.attemptedSubmit = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      queueMicrotask(() => this.errorSummary()?.nativeElement.focus());
      return;
    }

    const value = this.form.getRawValue();
    const current = this.initial();

    const categoryId = value.categoryId?.id ?? null;

    if (current) {
      const payload: UpdateProductPayload = {
        sku: value.sku.trim(),
        name: value.name.trim(),
        description: value.description.trim() || null,
        categoryId,
        price: value.price,
        imageUrl: value.imageUrl.trim() || null,
        id: current.id,
        status: value.status,
      };
      this.submitted.emit(payload);
    } else {
      const payload: CreateProductPayload = {
        sku: value.sku.trim(),
        name: value.name.trim(),
        description: value.description.trim() || null,
        categoryId,
        price: value.price,
        imageUrl: value.imageUrl.trim() || null,
        initialStock: value.initialStock || null,
      };
      this.submitted.emit(payload);
    }
  }
}
