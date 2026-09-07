import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { ProductRepository } from '../../domain/repositories/product.repository';
import {
  AddStockPayload,
  Category,
  CreateProductPayload,
  Product,
  ProductStock,
  UpdateProductPayload,
} from '../../domain/models/product.model';
import { toCategory, toProduct, toProductApiError, toProductStock } from '../mappers/product.mapper';
import { ProductApiService } from '../services/product-api.service';

@Injectable({ providedIn: 'root' })
export class ProductRepositoryImpl implements ProductRepository {
  private readonly api = inject(ProductApiService);

  getCatalog(): Observable<Product[]> {
    return this.api.getCatalog().pipe(
      map((dtos) => dtos.map(toProduct)),
      catchError((error) => throwError(() => toProductApiError(error))),
    );
  }

  getAdminList(): Observable<Product[]> {
    return this.api.getAdminList().pipe(
      map((dtos) => dtos.map(toProduct)),
      catchError((error) => throwError(() => toProductApiError(error))),
    );
  }

  getById(id: string): Observable<Product> {
    return this.api.getById(id).pipe(
      map(toProduct),
      catchError((error) => throwError(() => toProductApiError(error))),
    );
  }

  getStock(id: string): Observable<ProductStock> {
    return this.api.getStock(id).pipe(
      map(toProductStock),
      catchError((error) => throwError(() => toProductApiError(error))),
    );
  }

  getCategories(): Observable<Category[]> {
    return this.api.getCategories().pipe(
      map((dtos) => dtos.map(toCategory)),
      catchError((error) => throwError(() => toProductApiError(error))),
    );
  }

  create(payload: CreateProductPayload): Observable<string> {
    return this.api.create(payload).pipe(catchError((error) => throwError(() => toProductApiError(error))));
  }

  update(id: string, payload: UpdateProductPayload): Observable<void> {
    return this.api.update(id, payload).pipe(catchError((error) => throwError(() => toProductApiError(error))));
  }

  addStock(id: string, payload: AddStockPayload): Observable<void> {
    return this.api.addStock(id, payload).pipe(catchError((error) => throwError(() => toProductApiError(error))));
  }
}
