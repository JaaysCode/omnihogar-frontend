import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api.config';
import { CheckoutAddressInput, PaymentMethodPreference } from '../../domain/models/checkout.model';
import { CheckoutDto, CheckoutStatusDto, CreateCheckoutPreferenceRequestDto } from './checkout-api.dto';

/**
 * Raw HTTP client for the `/checkout` endpoints (HU-08/HU-09). Transport-only: no error
 * translation, no domain mapping — see `CheckoutRepositoryImpl` for that.
 */
@Injectable({ providedIn: 'root' })
export class CheckoutApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  createPreference(address: CheckoutAddressInput, paymentMethod: PaymentMethodPreference): Observable<CheckoutDto> {
    const body: CreateCheckoutPreferenceRequestDto = {
      address: address.address,
      city: address.city,
      neighborhood: address.neighborhood,
      reference: address.reference,
      paymentMethod,
    };
    return this.http.post<CheckoutDto>(`${this.baseUrl}/checkout/preference`, body);
  }

  retry(orderId: string): Observable<CheckoutDto> {
    return this.http.post<CheckoutDto>(`${this.baseUrl}/checkout/${orderId}/retry`, {});
  }

  getStatus(orderId: string, paymentId?: string): Observable<CheckoutStatusDto> {
    const query = paymentId ? `?paymentId=${encodeURIComponent(paymentId)}` : '';
    return this.http.get<CheckoutStatusDto>(`${this.baseUrl}/checkout/${orderId}/status${query}`);
  }
}
