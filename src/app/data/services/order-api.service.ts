import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api.config';
import { StoreSaleItem } from '../../domain/models/order.model';
import { OrderDetailDto, OrderSummaryDto, RegisterStoreSaleRequestDto, StoreSaleReceiptDto } from './order-api.dto';

/**
 * Raw HTTP client for the `/orders` endpoints. Transport-only: no error translation,
 * no domain mapping — see `OrderRepositoryImpl` for that.
 */
@Injectable({ providedIn: 'root' })
export class OrderApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getAll(): Observable<OrderSummaryDto[]> {
    return this.http.get<OrderSummaryDto[]>(`${this.baseUrl}/orders`);
  }

  getById(id: string): Observable<OrderDetailDto> {
    return this.http.get<OrderDetailDto>(`${this.baseUrl}/orders/${id}`);
  }

  registerStoreSale(items: StoreSaleItem[]): Observable<StoreSaleReceiptDto> {
    const body: RegisterStoreSaleRequestDto = { items };
    return this.http.post<StoreSaleReceiptDto>(`${this.baseUrl}/orders`, body);
  }
}
