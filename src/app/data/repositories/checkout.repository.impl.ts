import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { CheckoutRepository } from '../../domain/repositories/checkout.repository';
import { CheckoutAddressInput, CheckoutPreference, CheckoutStatus, PaymentMethodPreference } from '../../domain/models/checkout.model';
import { toCheckoutApiError, toCheckoutPreference, toCheckoutStatus } from '../mappers/checkout.mapper';
import { CheckoutApiService } from '../services/checkout-api.service';

@Injectable({ providedIn: 'root' })
export class CheckoutRepositoryImpl implements CheckoutRepository {
  private readonly api = inject(CheckoutApiService);

  createPreference(address: CheckoutAddressInput, paymentMethod: PaymentMethodPreference): Observable<CheckoutPreference> {
    return this.api.createPreference(address, paymentMethod).pipe(
      map(toCheckoutPreference),
      catchError((error) => throwError(() => toCheckoutApiError(error))),
    );
  }

  retry(orderId: string): Observable<CheckoutPreference> {
    return this.api.retry(orderId).pipe(
      map(toCheckoutPreference),
      catchError((error) => throwError(() => toCheckoutApiError(error))),
    );
  }

  getStatus(orderId: string, paymentId?: string): Observable<CheckoutStatus> {
    return this.api.getStatus(orderId, paymentId).pipe(
      map(toCheckoutStatus),
      catchError((error) => throwError(() => toCheckoutApiError(error))),
    );
  }
}
