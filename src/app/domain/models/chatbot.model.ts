/** One product/quantity pair in the customer's in-progress chat order (HU-19). */
export interface DraftItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

/** One matched product returned by the "search_product" intent, with stock info. */
export interface MatchedProduct {
  id: string;
  name: string;
  price: number;
  availableQuantity: number | null;
  inStock: boolean | null;
}

/** Populated only on the turn that confirmed and created the order. */
export interface OrderCreated {
  orderId: string;
  orderNumber: string;
  total: number;
}

/** One chat bubble, either from the customer or the bot — kept client-side for rendering. */
export interface ChatMessage {
  sender: 'customer' | 'bot';
  content: string;
}

/** Result of sending one message to the shopping assistant. */
export interface ChatMessageResponse {
  conversationId: string;
  reply: string;
  draftItems: DraftItem[];
  matchedProducts: MatchedProduct[] | null;
  orderCreated: OrderCreated | null;
}

/** One product/quantity pair sent back to the backend as the current draft, on every turn. */
export interface DraftItemInput {
  productId: string;
  quantity: number;
}

/** Normalized error thrown by the chatbot data layer. */
export class ChatbotApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChatbotApiError';
  }
}
