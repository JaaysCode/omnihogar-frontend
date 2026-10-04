/** Wire-shape DTOs — mirror the backend's JSON exactly (camelCase via System.Text.Json). */

export interface DraftItemInputDto {
  productId: string;
  quantity: number;
}

/** Body for POST /chatbot/messages. */
export interface SendChatMessageRequestDto {
  conversationId: string | null;
  message: string;
  draftItems: DraftItemInputDto[];
}

export interface ChatDraftItemDto {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface MatchedProductDto {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  price: number;
  imageUrl: string | null;
  status: string;
  availableQuantity: number | null;
  inStock: boolean | null;
}

export interface ChatOrderCreatedDto {
  orderId: string;
  orderNumber: string;
  total: number;
}

export interface ChatTurnResultDto {
  conversationId: string;
  reply: string;
  draftItems: ChatDraftItemDto[];
  matchedProducts: MatchedProductDto[] | null;
  orderCreated: ChatOrderCreatedDto | null;
}
