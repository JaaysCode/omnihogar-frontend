import { Observable } from 'rxjs';
import { AppNotification } from '../models/notification.model';

/**
 * Domain-facing contract for the topbar notification bell (HU-13). The presentation layer
 * depends on this abstract class, never on the concrete HTTP implementation in `data/`.
 */
export abstract class NotificationRepository {
  /** The authenticated user's own in-app notifications, newest first. */
  abstract getMine(): Observable<AppNotification[]>;
  /** Marks a single notification as read. */
  abstract markRead(id: string): Observable<void>;
  /** Marks every unread notification as read. */
  abstract markAllRead(): Observable<void>;
}
