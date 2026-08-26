import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api.config';
import { CreateProductPayload, UpdateProductPayload } from '../../domain/models/product.model';
import { CreateProductRequestDto, ProductDto, UpdateProductRequestDto } from './product-api.dto';

/**
 * Raw HTTP client for the `/products` endpoints. Transport-only: no error translation,
 * no domain mapping — see `ProductRepositoryImpl` for that.
 */
@Injectable({ providedIn: 'root' })
export class ProductApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getCatalog(): Observable<ProductDto[]> {
    return this.http.get<ProductDto[]>(`${this.baseUrl}/products`);
  }

  getAdminList(): Observable<ProductDto[]> {
    return this.http.get<ProductDto[]>(`${this.baseUrl}/products/admin`);
  }

  getById(id: string): Observable<ProductDto> {
    return this.http.get<ProductDto>(`${this.baseUrl}/products/${id}`);
  }

  create(payload: CreateProductPayload): Observable<string> {
    const body: CreateProductRequestDto = {
      sku: payload.sku,
      name: payload.name,
      description: payload.description,
      categoryId: payload.categoryId,
      price: payload.price,
      imageUrl: payload.imageUrl,
    };
    return this.http.post<string>(`${this.baseUrl}/products`, body);
  }

  update(id: string, payload: UpdateProductPayload): Observable<void> {
    const body: UpdateProductRequestDto = {
      id: payload.id,
      sku: payload.sku,
      name: payload.name,
      description: payload.description,
      categoryId: payload.categoryId,
      price: payload.price,
      imageUrl: payload.imageUrl,
      status: payload.status,
    };
    return this.http.put<void>(`${this.baseUrl}/products/${id}`, body);
  }
}
