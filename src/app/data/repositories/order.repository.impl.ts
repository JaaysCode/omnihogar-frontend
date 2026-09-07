import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { OrderRepository } from '../../domain/repositories/order.repository';
import { OrderDetail, OrderSummary } from '../../domain/models/order.model';
import { toOrderApiError, toOrderDetail, toOrderSummary } from '../mappers/order.mapper';
import { OrderApiService } from '../services/order-api.service';

@Injectable({ providedIn: 'root' })
export class OrderRepositoryImpl implements OrderRepository {
  private readonly api = inject(OrderApiService);

  getAll(): Observable<OrderSummary[]> {
    return this.api.getAll().pipe(
      map((dtos) => dtos.map(toOrderSummary)),
      catchError((error) => throwError(() => toOrderApiError(error))),
    );
  }

  getById(id: string): Observable<OrderDetail> {
    return this.api.getById(id).pipe(
      map(toOrderDetail),
      catchError((error) => throwError(() => toOrderApiError(error))),
    );
  }
}
