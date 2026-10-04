import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { ChatbotRepository } from '../../domain/repositories/chatbot.repository';
import { ChatMessageResponse, DraftItemInput } from '../../domain/models/chatbot.model';
import { toChatMessageResponse, toChatbotApiError } from '../mappers/chatbot.mapper';
import { ChatbotApiService } from '../services/chatbot-api.service';

@Injectable({ providedIn: 'root' })
export class ChatbotRepositoryImpl implements ChatbotRepository {
  private readonly api = inject(ChatbotApiService);

  sendMessage(conversationId: string | null, message: string, draftItems: DraftItemInput[]): Observable<ChatMessageResponse> {
    return this.api.sendMessage(conversationId, message, draftItems).pipe(
      map(toChatMessageResponse),
      catchError((error) => throwError(() => toChatbotApiError(error))),
    );
  }
}
