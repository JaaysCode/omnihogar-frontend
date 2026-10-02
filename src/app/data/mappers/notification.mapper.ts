import { HttpErrorResponse } from '@angular/common/http';
import { AppNotification, NotificationApiError } from '../../domain/models/notification.model';
import { NotificationDto } from '../services/notification-api.dto';

export function toAppNotification(dto: NotificationDto): AppNotification {
  return {
    id: dto.id,
    type: dto.type,
    content: dto.content,
    orderId: dto.orderId,
    orderNumber: dto.orderNumber,
    isRead: dto.isRead,
    createdAt: dto.createdAt,
  };
}

/** Translates a failed HTTP call into a domain-level {@link NotificationApiError}. */
export function toNotificationApiError(error: unknown): NotificationApiError {
  if (!(error instanceof HttpErrorResponse)) {
    return new NotificationApiError(
      $localize`:@@notifications.error.generic:Ocurrió un error inesperado. Inténtalo de nuevo.`,
    );
  }

  if (error.status === 401 || error.status === 403) {
    return new NotificationApiError($localize`:@@notifications.error.forbidden:No tienes permisos para esto.`);
  }

  if (error.status === 404) {
    return new NotificationApiError($localize`:@@notifications.error.notFound:La notificación no existe.`);
  }

  if (error.status === 0) {
    return new NotificationApiError(
      $localize`:@@notifications.error.offline:No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.`,
    );
  }

  return new NotificationApiError(
    $localize`:@@notifications.error.generic:Ocurrió un error inesperado. Inténtalo de nuevo.`,
  );
}
