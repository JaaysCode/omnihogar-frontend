import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { OrderRepository } from '../../domain/repositories/order.repository';
import {
  OrderDetail,
  OrderStatus,
  OrderSummary,
  StoreSaleItem,
  StoreSaleReceipt,
  UpdateOrderStatusPayload,
} from '../../domain/models/order.model';
import { toOrderApiError, toOrderDetail, toOrderSummary, toStoreSaleReceipt } from '../mappers/order.mapper';
import { OrderApiService } from '../services/order-api.service';

@Injectable({ providedIn: 'root' })
export class OrderRepositoryImpl implements OrderRepository {
  private readonly api = inject(OrderApiService);

  getAll(status?: OrderStatus): Observable<OrderSummary[]> {
    return this.api.getAll(status).pipe(
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

  registerStoreSale(items: StoreSaleItem[]): Observable<StoreSaleReceipt> {
    return this.api.registerStoreSale(items).pipe(
      map(toStoreSaleReceipt),
      catchError((error) => throwError(() => toOrderApiError(error))),
    );
  }

  updateStatus(id: string, payload: UpdateOrderStatusPayload): Observable<OrderDetail> {
    return this.api.updateStatus(id, { status: payload.status, comment: payload.comment }).pipe(
      map(toOrderDetail),
      catchError((error) => throwError(() => toOrderApiError(error))),
    );
  }

  getMine(): Observable<OrderSummary[]> {
    return this.api.getMine().pipe(
      map((dtos) => dtos.map(toOrderSummary)),
      catchError((error) => throwError(() => toOrderApiError(error))),
    );
  }

  getMineById(id: string): Observable<OrderDetail> {
    return this.api.getMineById(id).pipe(
      map(toOrderDetail),
      catchError((error) => throwError(() => toOrderApiError(error))),
    );
  }
}
