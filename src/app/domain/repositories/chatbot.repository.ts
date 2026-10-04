import { Observable } from 'rxjs';
import { ChatMessageResponse, DraftItemInput } from '../models/chatbot.model';

/**
 * Domain-facing contract for the shopping-assistant chat (HU-19). The presentation layer
 * depends on this abstract class, never on the concrete HTTP implementation in `data/`.
 */
export abstract class ChatbotRepository {
  /**
   * Send one chat turn: the customer's free-text message plus the current draft (resent in
   * full every turn — the backend never mutates it except on "confirm_order").
   */
  abstract sendMessage(
    conversationId: string | null,
    message: string,
    draftItems: DraftItemInput[],
  ): Observable<ChatMessageResponse>;
}
