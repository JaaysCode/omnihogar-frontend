import { ChangeDetectionStrategy, Component, ElementRef, computed, effect, input, output, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiButton, TuiIcon } from '@taiga-ui/core';
import {
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
];

@Component({
  selector: 'app-product-form',
  imports: [ReactiveFormsModule, TuiButton, TuiIcon],
  templateUrl: './product-form.html',
  styleUrl: './product-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductForm {
  /** When set, the form pre-fills and submits an update for this product; otherwise a create. */
  readonly initial = input<Product | null>(null);
  /** Server-side field errors from a failed submit (e.g. duplicate SKU), keyed camelCase. */
  readonly fieldErrors = input<FieldErrors | null>(null);
  readonly pending = input(false);

  readonly submitted = output<CreateProductPayload | UpdateProductPayload>();

  protected readonly isEdit = computed(() => this.initial() !== null);

  private readonly errorSummary = viewChild<ElementRef<HTMLElement>>('errorSummary');
  private readonly fb = new FormBuilder().nonNullable;

  protected attemptedSubmit = false;

  protected readonly form = this.fb.group({
    sku: this.fb.control('', [Validators.required, Validators.maxLength(20)]),
    name: this.fb.control('', [Validators.required, Validators.maxLength(150)]),
    description: this.fb.control(''),
    price: this.fb.control(0, [Validators.required, Validators.min(0)]),
    imageUrl: this.fb.control(''),
    status: this.fb.control<ProductStatus>('active'),
  });

  constructor() {
    // Prefill when editing — `initial` can arrive after construction (async fetch by route id).
    effect(() => {
      const product = this.initial();
      if (product) {
        this.form.patchValue({
          sku: product.sku,
          name: product.name,
          description: product.description ?? '',
          price: product.price,
          imageUrl: product.imageUrl ?? '',
          status: product.status,
        });
      }
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

  protected onSubmit(): void {
    this.attemptedSubmit = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      queueMicrotask(() => this.errorSummary()?.nativeElement.focus());
      return;
    }

    const value = this.form.getRawValue();
    const base: CreateProductPayload = {
      sku: value.sku.trim(),
      name: value.name.trim(),
      description: value.description.trim() || null,
      categoryId: this.initial()?.categoryId ?? null,
      price: value.price,
      imageUrl: value.imageUrl.trim() || null,
    };

    const current = this.initial();
    if (current) {
      const payload: UpdateProductPayload = { ...base, id: current.id, status: value.status };
      this.submitted.emit(payload);
    } else {
      this.submitted.emit(base);
    }
  }
}
