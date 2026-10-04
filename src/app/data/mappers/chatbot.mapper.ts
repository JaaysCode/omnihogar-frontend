import { HttpErrorResponse } from '@angular/common/http';
import {
  ChatMessageResponse,
  ChatbotApiError,
  DraftItem,
  MatchedProduct,
  OrderCreated,
} from '../../domain/models/chatbot.model';
import { ApiProblemDto } from '../services/auth-api.dto';
import { ChatDraftItemDto, ChatOrderCreatedDto, ChatTurnResultDto, MatchedProductDto } from '../services/chatbot-api.dto';

function toDraftItem(dto: ChatDraftItemDto): DraftItem {
  return {
    productId: dto.productId,
    productName: dto.name,
    quantity: dto.quantity,
    unitPrice: dto.unitPrice,
    subtotal: dto.subtotal,
  };
}

function toMatchedProduct(dto: MatchedProductDto): MatchedProduct {
  return {
    id: dto.id,
    name: dto.name,
    price: dto.price,
    availableQuantity: dto.availableQuantity,
    inStock: dto.inStock,
  };
}

function toOrderCreated(dto: ChatOrderCreatedDto): OrderCreated {
  return {
    orderId: dto.orderId,
    orderNumber: dto.orderNumber,
    total: dto.total,
  };
}

export function toChatMessageResponse(dto: ChatTurnResultDto): ChatMessageResponse {
  return {
    conversationId: dto.conversationId,
    reply: dto.reply,
    draftItems: dto.draftItems.map(toDraftItem),
    matchedProducts: dto.matchedProducts ? dto.matchedProducts.map(toMatchedProduct) : null,
    orderCreated: dto.orderCreated ? toOrderCreated(dto.orderCreated) : null,
  };
}

/** Translates a failed HTTP call into a domain-level {@link ChatbotApiError}. */
export function toChatbotApiError(error: unknown): ChatbotApiError {
  if (!(error instanceof HttpErrorResponse)) {
    return new ChatbotApiError($localize`:@@chatbot.error.generic:Ocurrió un error inesperado. Inténtalo de nuevo.`);
  }

  if (error.status === 400) {
    const problem = error.error as ApiProblemDto | null;
    const firstError = problem?.errors ? Object.values(problem.errors)[0]?.[0] : undefined;
    return new ChatbotApiError(
      firstError ?? problem?.title ?? $localize`:@@chatbot.error.validation:Revisa tu mensaje e inténtalo de nuevo.`,
    );
  }

  if (error.status === 401 || error.status === 403) {
    return new ChatbotApiError($localize`:@@chatbot.error.forbidden:Debes iniciar sesión para usar el asistente.`);
  }

  if (error.status === 0) {
    return new ChatbotApiError(
      $localize`:@@chatbot.error.offline:No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.`,
    );
  }

  return new ChatbotApiError($localize`:@@chatbot.error.generic:Ocurrió un error inesperado. Inténtalo de nuevo.`);
}
