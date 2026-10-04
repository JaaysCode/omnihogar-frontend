import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TuiButton, TuiIcon } from '@taiga-ui/core';
import { PublicHeader } from '../../components/public-header/public-header';
import { CopCurrencyPipe } from '../../../shared/pipes/cop-currency.pipe';
import {
  ChatMessage,
  ChatbotApiError,
  DraftItem,
  DraftItemInput,
  MatchedProduct,
  OrderCreated,
} from '../../../domain/models/chatbot.model';
import { ChatbotRepository } from '../../../domain/repositories/chatbot.repository';

/**
 * Asistente de compras por chat (HU-19). El borrador del pedido vive aquí (signal local), no en
 * un store persistente — se reenvía completo en cada turno. El backend nunca lo muta salvo en
 * la rama de confirmación, así que tras cada respuesta simplemente lo reemplazamos con el eco
 * resuelto (`response.draftItems`) que ya trae nombre/precio correctos.
 */
@Component({
  selector: 'app-chat-page',
  imports: [PublicHeader, TuiButton, TuiIcon, CopCurrencyPipe],
  templateUrl: './chat-page.html',
  styleUrl: './chat-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatPage {
  private readonly chatbotRepository = inject(ChatbotRepository);

  protected readonly messages = signal<ChatMessage[]>([]);
  protected readonly draft = signal<DraftItem[]>([]);
  protected readonly matchedProducts = signal<MatchedProduct[] | null>(null);
  protected readonly orderCreated = signal<OrderCreated | null>(null);
  protected readonly pending = signal(false);
  protected readonly loadError = signal<string | null>(null);
  protected readonly messageText = signal('');

  private readonly conversationId = signal<string | null>(null);

  protected readonly draftTotal = computed(() => this.draft().reduce((sum, item) => sum + item.subtotal, 0));

  protected onSend(): void {
    const text = this.messageText().trim();
    if (!text) {
      return;
    }
    this.messageText.set('');
    this.send(text);
  }

  protected onConfirm(): void {
    this.send($localize`:@@chat.confirmMessage:Confirmar pedido`);
  }

  protected addToDraft(product: MatchedProduct, quantity: number): void {
    const safeQuantity = Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1;
    const existing = this.draft().find((item) => item.productId === product.id);
    const newQuantity = (existing?.quantity ?? 0) + safeQuantity;
    const updated: DraftItem = {
      productId: product.id,
      productName: product.name,
      quantity: newQuantity,
      unitPrice: product.price,
      subtotal: product.price * newQuantity,
    };
    this.draft.set([...this.draft().filter((item) => item.productId !== product.id), updated]);
  }

  protected removeFromDraft(productId: string): void {
    this.draft.set(this.draft().filter((item) => item.productId !== productId));
  }

  private send(text: string): void {
    if (this.pending()) {
      return;
    }
    this.pending.set(true);
    this.loadError.set(null);
    this.messages.update((current) => [...current, { sender: 'customer', content: text }]);

    const draftItems: DraftItemInput[] = this.draft().map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));

    this.chatbotRepository.sendMessage(this.conversationId(), text, draftItems).subscribe({
      next: (response) => {
        this.pending.set(false);
        this.conversationId.set(response.conversationId);
        this.messages.update((current) => [...current, { sender: 'bot', content: response.reply }]);
        this.matchedProducts.set(response.matchedProducts);

        if (response.orderCreated) {
          this.orderCreated.set(response.orderCreated);
          this.draft.set([]);
          this.matchedProducts.set(null);
        } else {
          this.draft.set(response.draftItems);
        }
      },
      error: (error: ChatbotApiError) => {
        this.pending.set(false);
        this.loadError.set(error.message);
      },
    });
  }
}
