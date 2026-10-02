import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { NotificationRepository } from '../../domain/repositories/notification.repository';
import { AppNotification } from '../../domain/models/notification.model';
import { toAppNotification, toNotificationApiError } from '../mappers/notification.mapper';
import { NotificationApiService } from '../services/notification-api.service';

@Injectable({ providedIn: 'root' })
export class NotificationRepositoryImpl implements NotificationRepository {
  private readonly api = inject(NotificationApiService);

  getMine(): Observable<AppNotification[]> {
    return this.api.getMine().pipe(
      map((dtos) => dtos.map(toAppNotification)),
      catchError((error) => throwError(() => toNotificationApiError(error))),
    );
  }

  markRead(id: string): Observable<void> {
    return this.api.markRead(id).pipe(catchError((error) => throwError(() => toNotificationApiError(error))));
  }

  markAllRead(): Observable<void> {
    return this.api.markAllRead().pipe(catchError((error) => throwError(() => toNotificationApiError(error))));
  }
}
