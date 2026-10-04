import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTaiga } from '@taiga-ui/core';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ChatPage } from './chat-page';
import { ChatbotRepository } from '../../../domain/repositories/chatbot.repository';
import { ChatMessageResponse, ChatbotApiError } from '../../../domain/models/chatbot.model';
import { CartStore } from '../../../core/services/cart-store.service';

describe('ChatPage', () => {
  let fixture: ComponentFixture<ChatPage>;
  let chatbotRepository: { sendMessage: ReturnType<typeof vi.fn> };

  function build() {
    chatbotRepository = { sendMessage: vi.fn() };
    // ChatPage renders <app-public-header>, which injects CartStore — stub it out, its
    // behavior isn't under test here.
    const cartStore = { itemCount: signal(0) };

    TestBed.configureTestingModule({
      imports: [ChatPage],
      providers: [
        provideRouter([]),
        provideTaiga(),
        { provide: ChatbotRepository, useValue: chatbotRepository },
        { provide: CartStore, useValue: cartStore },
      ],
    });

    fixture = TestBed.createComponent(ChatPage);
    fixture.detectChanges();
  }

  function setMessageInput(value: string): void {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('.chat-page__input-row input');
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function clickSend(): void {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.chat-page__input-row button');
    button.click();
    fixture.detectChanges();
  }

  const SEARCH_RESPONSE: ChatMessageResponse = {
    conversationId: 'conv-1',
    reply: 'Encontré esto: Taladro',
    draftItems: [],
    matchedProducts: [{ id: 'p1', name: 'Taladro', price: 150000, availableQuantity: 5, inStock: true }],
    orderCreated: null,
  };

  it('sending a message adds the customer and bot bubbles, and updates the matched products', () => {
    build();
    chatbotRepository.sendMessage.mockReturnValue(of(SEARCH_RESPONSE));

    setMessageInput('busco un taladro');
    clickSend();

    expect(chatbotRepository.sendMessage).toHaveBeenCalledWith(null, 'busco un taladro', []);
    expect(fixture.nativeElement.textContent).toContain('busco un taladro');
    expect(fixture.nativeElement.textContent).toContain('Encontré esto: Taladro');
    expect(fixture.nativeElement.textContent).toContain('Taladro');
  });

  it('confirming sends the current draft and shows the created order number', () => {
    build();
    chatbotRepository.sendMessage.mockReturnValue(of(SEARCH_RESPONSE));
    setMessageInput('busco un taladro');
    clickSend();

    chatbotRepository.sendMessage.mockReturnValue(
      of({
        conversationId: 'conv-1',
        reply: '¡Listo!',
        draftItems: [],
        matchedProducts: null,
        orderCreated: { orderId: 'o1', orderNumber: 'CHAT-1', total: 150000 },
      } as ChatMessageResponse),
    );

    const addButton: HTMLButtonElement = fixture.nativeElement.querySelector('.chat-match button');
    addButton.click();
    fixture.detectChanges();

    const confirmButton: HTMLButtonElement = fixture.nativeElement.querySelector('.chat-page__draft > button');
    confirmButton.click();
    fixture.detectChanges();

    const lastCall = chatbotRepository.sendMessage.mock.calls.at(-1)!;
    expect(lastCall[2]).toEqual([{ productId: 'p1', quantity: 1 }]);
    expect(fixture.nativeElement.textContent).toContain('CHAT-1');
  });

  it('a failed turn shows an error banner and does not add a fake bot bubble', () => {
    build();
    chatbotRepository.sendMessage.mockReturnValue(throwError(() => new ChatbotApiError('boom')));

    setMessageInput('hola');
    clickSend();

    expect(fixture.nativeElement.textContent).toContain('boom');
    const bubbles = fixture.nativeElement.querySelectorAll('.chat-bubble--bot');
    expect(bubbles.length).toBe(0);
  });
});
