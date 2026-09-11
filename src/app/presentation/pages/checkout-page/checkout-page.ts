import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TuiButton, TuiIcon } from '@taiga-ui/core';
import { CheckoutApiError, PaymentMethodPreference } from '../../../domain/models/checkout.model';
import { CheckoutRepository } from '../../../domain/repositories/checkout.repository';
import { CartStore } from '../../../core/services/cart-store.service';
import { CopCurrencyPipe } from '../../../shared/pipes/cop-currency.pipe';
import { fieldErrorMessage, summaryErrorMessage } from '../../../shared/utils/form-error-messages';
import { PublicHeader } from '../../components/public-header/public-header';

interface FieldSpec {
  readonly control: string;
  readonly label: string;
}

// Kept separate from the on-screen <label> (which also carries the "*" required marker) —
// same reasoning as create-employee-form's FIELDS.
const FIELDS: readonly FieldSpec[] = [
  { control: 'address', label: $localize`:@@checkout.field.address.name:Dirección` },
  { control: 'city', label: $localize`:@@checkout.field.city.name:Ciudad` },
  { control: 'paymentMethod', label: $localize`:@@checkout.field.paymentMethod.name:Método de pago` },
];

const PAYMENT_METHOD_LABELS: Record<PaymentMethodPreference, string> = {
  card: $localize`:@@checkout.paymentMethod.card:Tarjeta de crédito o débito`,
  pse: $localize`:@@checkout.paymentMethod.pse:PSE`,
  wallet: $localize`:@@checkout.paymentMethod.wallet:Cuenta de Mercado Pago`,
};

/**
 * Checkout (HU-08 dirección + método de pago, HU-09 pago). One submit both creates the order
 * from the cart and starts a Mercado Pago Checkout Pro payment; on success the whole page
 * redirects to Mercado Pago's hosted checkout (`window.location.href`, not a router navigation).
 */
@Component({
  selector: 'app-checkout-page',
  imports: [ReactiveFormsModule, RouterLink, PublicHeader, CopCurrencyPipe, TuiButton, TuiIcon],
  templateUrl: './checkout-page.html',
  styleUrl: './checkout-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutPage implements OnInit {
  private readonly checkoutRepository = inject(CheckoutRepository);
  private readonly cartStore = inject(CartStore);
  private readonly fb = new FormBuilder().nonNullable;

  protected readonly items = this.cartStore.items;
  protected readonly itemCount = this.cartStore.itemCount;
  protected readonly subtotal = this.cartStore.subtotal;
  protected readonly total = this.cartStore.total;

  protected readonly paymentMethods: readonly PaymentMethodPreference[] = ['card', 'pse', 'wallet'];

  private readonly errorSummary = viewChild<ElementRef<HTMLElement>>('errorSummary');

  protected attemptedSubmit = false;
  protected readonly pending = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly form = this.fb.group({
    address: this.fb.control('', [Validators.required, Validators.maxLength(255)]),
    city: this.fb.control('', [Validators.required, Validators.maxLength(100)]),
    neighborhood: this.fb.control('', [Validators.maxLength(100)]),
    reference: this.fb.control('', [Validators.maxLength(255)]),
    paymentMethod: this.fb.control<PaymentMethodPreference | null>(null, [Validators.required]),
  });

  protected readonly selectedPaymentMethod = computed(() => this.form.controls.paymentMethod.value);

  ngOnInit(): void {
    this.cartStore.load();
  }

  protected paymentMethodLabel(method: PaymentMethodPreference): string {
    return PAYMENT_METHOD_LABELS[method];
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
        $localize`:@@checkout.field.genericInvalid:El campo «${label}:label:» no es válido.`,
    }));
  }

  protected focusField(control: string): void {
    if (control === 'paymentMethod') {
      document.getElementById('checkout-payment-methods')?.focus();
      return;
    }
    document.getElementById(`checkout-${control}`)?.focus();
  }

  protected onSelectPaymentMethod(method: PaymentMethodPreference): void {
    this.form.controls.paymentMethod.setValue(method);
    this.form.controls.paymentMethod.markAsTouched();
  }

  protected onSubmit(): void {
    this.attemptedSubmit = true;
    this.formError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      queueMicrotask(() => this.errorSummary()?.nativeElement.focus());
      return;
    }

    const value = this.form.getRawValue();
    if (!value.paymentMethod) {
      return;
    }

    this.pending.set(true);

    this.checkoutRepository
      .createPreference(
        {
          address: value.address.trim(),
          city: value.city.trim(),
          neighborhood: value.neighborhood.trim() || null,
          reference: value.reference.trim() || null,
        },
        value.paymentMethod,
      )
      .subscribe({
        next: (preference) => {
          window.location.href = preference.initPoint;
        },
        error: (error: CheckoutApiError) => {
          this.pending.set(false);
          this.applyFieldErrors(error);
        },
      });
  }

  private applyFieldErrors(error: CheckoutApiError): void {
    const fieldErrors = error.fieldErrors;
    if (!fieldErrors) {
      this.formError.set(error.message);
      return;
    }

    let matchedAControl = false;
    for (const [field, messages] of Object.entries(fieldErrors)) {
      const control = this.form.get(field);
      if (control && messages.length > 0) {
        control.setErrors({ ...control.errors, server: messages[0] });
        control.markAsTouched();
        matchedAControl = true;
      }
    }

    // "cart" / "gateway" / "order" field errors have no matching control — surface them as the
    // page-level banner instead (e.g. insufficient stock, Mercado Pago unreachable).
    if (!matchedAControl) {
      this.formError.set(Object.values(fieldErrors)[0]?.[0] ?? error.message);
    }
  }
}
