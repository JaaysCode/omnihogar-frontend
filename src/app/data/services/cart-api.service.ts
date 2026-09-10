import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api.config';
import { AddCartItemRequestDto, CartDto, SetCartItemQuantityRequestDto } from './cart-api.dto';

/**
 * Raw HTTP client for the `/cart` endpoints (HU-05). Transport-only: no error translation,
 * no domain mapping — see `CartRepositoryImpl` for that.
 */
@Injectable({ providedIn: 'root' })
export class CartApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getCart(): Observable<CartDto> {
    return this.http.get<CartDto>(`${this.baseUrl}/cart`);
  }

  addItem(productId: string, quantity: number): Observable<CartDto> {
    const body: AddCartItemRequestDto = { productId, quantity };
    return this.http.post<CartDto>(`${this.baseUrl}/cart/items`, body);
  }

  updateItemQuantity(productId: string, quantity: number): Observable<CartDto> {
    const body: SetCartItemQuantityRequestDto = { quantity };
    return this.http.put<CartDto>(`${this.baseUrl}/cart/items/${productId}`, body);
  }

  removeItem(productId: string): Observable<CartDto> {
    return this.http.delete<CartDto>(`${this.baseUrl}/cart/items/${productId}`);
  }
}
