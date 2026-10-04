import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api.config';
import { DraftItemInput } from '../../domain/models/chatbot.model';
import { ChatTurnResultDto, SendChatMessageRequestDto } from './chatbot-api.dto';

/**
 * Raw HTTP client for the `/chatbot` endpoint. Transport-only: no error translation,
 * no domain mapping — see `ChatbotRepositoryImpl` for that.
 */
@Injectable({ providedIn: 'root' })
export class ChatbotApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  sendMessage(
    conversationId: string | null,
    message: string,
    draftItems: DraftItemInput[],
  ): Observable<ChatTurnResultDto> {
    const body: SendChatMessageRequestDto = { conversationId, message, draftItems };
    return this.http.post<ChatTurnResultDto>(`${this.baseUrl}/chatbot/messages`, body);
  }
}
