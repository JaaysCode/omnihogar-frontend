import { ChangeDetectionStrategy, Component, ElementRef, computed, effect, input, output, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiButton, TuiDataList, TuiDropdown, TuiIcon } from '@taiga-ui/core';
import { TuiChevron } from '@taiga-ui/kit';
import { AddStockPayload, FieldErrors, Product } from '../../../domain/models/product.model';
import { fieldErrorMessage, summaryErrorMessage } from '../../../shared/utils/form-error-messages';

interface FieldSpec {
  readonly control: string;
  readonly label: string;
}

const FIELDS: readonly FieldSpec[] = [
  { control: 'productId', label: $localize`:@@inventory.addStock.field.product.name:Producto` },
  { control: 'quantity', label: $localize`:@@inventory.addStock.field.quantity.name:Cantidad` },
  { control: 'reason', label: $localize`:@@inventory.addStock.field.reason.name:Motivo` },
];

/** Emitted on submit — the target product's id plus the raw POST /products/{id}/stock body. */
export interface AddStockSubmit {
  readonly productId: string;
  readonly payload: AddStockPayload;
}

@Component({
  selector: 'app-add-stock-form',
  imports: [ReactiveFormsModule, TuiButton, TuiIcon, TuiDropdown, TuiDataList, TuiChevron],
  templateUrl: './add-stock-form.html',
  styleUrl: './add-stock-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddStockForm {
  /** Catalog to pick from — the inventory page's already-loaded product list. */
  readonly products = input<Product[]>([]);
  /** Pre-selects the product dropdown (e.g. the row the user had expanded before opening this). */
  readonly preselected = input<Product | null>(null);
  /** Server-side field errors from a failed submit, keyed camelCase. */
  readonly fieldErrors = input<FieldErrors | null>(null);
  readonly pending = input(false);

  readonly submitted = output<AddStockSubmit>();

  private readonly errorSummary = viewChild<ElementRef<HTMLElement>>('errorSummary');
  private readonly fb = new FormBuilder().nonNullable;

  protected attemptedSubmit = false;

  protected readonly submitLabel = computed(() =>
    this.pending()
      ? $localize`:@@inventory.addStock.submit.pending:Agregando…`
      : $localize`:@@inventory.addStock.submit.idle:Agregar Unidades`,
  );

  protected readonly productPlaceholder = $localize`:@@inventory.addStock.field.product.placeholder:Selecciona un producto`;

  protected readonly productMenuOpen = signal(false);

  protected readonly form = this.fb.group({
    // Holds the selected `Product` object (not just its id) — set from the dropdown's
    // `onSelectProduct` below. Unwrapped to `.id` in `onSubmit`.
    productId: this.fb.control<Product | null>(null, [Validators.required]),
    quantity: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
    reason: this.fb.control('', [Validators.maxLength(200)]),
  });

  // Read reactively for the trigger button's label — `toSignal` keeps this in sync with
  // `productId`'s value regardless of whether it changed via `onSelectProduct` or `patchValue`.
  protected readonly selectedProduct = toSignal(this.form.controls.productId.valueChanges, {
    initialValue: this.form.controls.productId.value,
  });

  protected readonly productButtonLabel = computed(() => this.selectedProduct()?.name ?? this.productPlaceholder);

  constructor() {
    // Prefill the dropdown when opened from a row the user already had expanded.
    effect(() => {
      const product = this.preselected();
      if (product) {
        this.form.controls.productId.setValue(product);
      }
    });

    // Merge server-side errors (e.g. "insufficient facility capacity") into the matching
    // control, and clear them the moment the user edits the field again.
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
    return fieldErrorMessage(c.errors);
  }

  protected get invalidFieldSummary(): { control: string; label: string; message: string }[] {
    return FIELDS.filter(({ control }) => this.form.get(control)?.invalid).map(({ control, label }) => ({
      control,
      label,
      message:
        summaryErrorMessage(label, this.form.get(control)?.errors) ??
        $localize`:@@inventory.addStock.error.summaryFallback:${label}:label: no es válido.`,
    }));
  }

  protected focusField(control: string): void {
    const element = document.getElementById(`add-stock-${control}`);
    element?.focus();
  }

  protected onSelectProduct(product: Product): void {
    this.form.controls.productId.setValue(product);
    this.form.controls.productId.markAsTouched();
    this.productMenuOpen.set(false);
  }

  protected onSubmit(): void {
    this.attemptedSubmit = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      queueMicrotask(() => this.errorSummary()?.nativeElement.focus());
      return;
    }

    const value = this.form.getRawValue();
    if (!value.productId || value.quantity === null) {
      return;
    }
    this.submitted.emit({
      productId: value.productId.id,
      payload: {
        quantity: value.quantity,
        reason: value.reason.trim() || null,
      },
    });
  }
}
