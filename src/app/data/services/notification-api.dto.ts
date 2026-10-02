/** Wire-shape DTO — mirrors the backend's JSON exactly (camelCase via System.Text.Json). */
export interface NotificationDto {
  id: string;
  type: string;
  content: string;
  orderId: string | null;
  orderNumber: string | null;
  isRead: boolean;
  createdAt: string;
}
