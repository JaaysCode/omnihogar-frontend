/** Wire-shape DTOs — mirror the backend's JSON exactly (camelCase via System.Text.Json). */

export interface CartItemDto {
  productId: string;
  sku: string;
  name: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  availableQuantity: number;
}

export interface CartDto {
  id: string;
  items: CartItemDto[];
  subtotal: number;
  total: number;
  itemCount: number;
}

/** Body for POST /cart/items. */
export interface AddCartItemRequestDto {
  productId: string;
  quantity: number;
}

/** Body for PUT /cart/items/{productId}. */
export interface SetCartItemQuantityRequestDto {
  quantity: number;
}
