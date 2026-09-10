import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { Cart } from '../../domain/models/cart.model';
import { CartRepository } from '../../domain/repositories/cart.repository';
import { toCart, toCartApiError } from '../mappers/cart.mapper';
import { CartApiService } from '../services/cart-api.service';

@Injectable({ providedIn: 'root' })
export class CartRepositoryImpl implements CartRepository {
  private readonly api = inject(CartApiService);

  getCart(): Observable<Cart> {
    return this.api.getCart().pipe(
      map(toCart),
      catchError((error) => throwError(() => toCartApiError(error))),
    );
  }

  addItem(productId: string, quantity: number): Observable<Cart> {
    return this.api.addItem(productId, quantity).pipe(
      map(toCart),
      catchError((error) => throwError(() => toCartApiError(error))),
    );
  }

  updateItemQuantity(productId: string, quantity: number): Observable<Cart> {
    return this.api.updateItemQuantity(productId, quantity).pipe(
      map(toCart),
      catchError((error) => throwError(() => toCartApiError(error))),
    );
  }

  removeItem(productId: string): Observable<Cart> {
    return this.api.removeItem(productId).pipe(
      map(toCart),
      catchError((error) => throwError(() => toCartApiError(error))),
    );
  }
}
