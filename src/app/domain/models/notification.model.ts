/** Row shape for the topbar notification bell (HU-13). */
export interface AppNotification {
  id: string;
  /** e.g. "dispatch_ready". */
  type: string;
  content: string;
  orderId: string | null;
  orderNumber: string | null;
  isRead: boolean;
  createdAt: string;
}

/** Normalized error thrown by the notification data layer. */
export class NotificationApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotificationApiError';
  }
}
