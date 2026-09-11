/** Wire-shape DTOs — mirror the backend's JSON exactly (camelCase via System.Text.Json). */

/** Body for POST /checkout/preference. */
export interface CreateCheckoutPreferenceRequestDto {
  address: string;
  city: string;
  neighborhood: string | null;
  reference: string | null;
  paymentMethod: string;
}

export interface CheckoutDto {
  orderId: string;
  orderNumber: string;
  initPoint: string;
}

export interface CheckoutStatusDto {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  total: number;
  gatewayUnavailable: boolean;
}
