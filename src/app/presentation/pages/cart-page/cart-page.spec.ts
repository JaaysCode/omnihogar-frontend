import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideTaiga, TuiAlertService } from '@taiga-ui/core';
import { EMPTY, of } from 'rxjs';
import { vi } from 'vitest';
import { CartPage } from './cart-page';
import { CartStore } from '../../../core/services/cart-store.service';
import { CartItem } from '../../../domain/models/cart.model';

const LINE: CartItem = {
  productId: 'p1',
  sku: 'SKU-1',
  name: 'Silla Ergonómica',
  imageUrl: null,
  unitPrice: 100,
  quantity: 2,
  subtotal: 200,
  availableQuantity: 5,
};

describe('CartPage', () => {
  let fixture: ComponentFixture<CartPage>;
  let store: {
    items: ReturnType<typeof signal<CartItem[]>>;
    itemCount: ReturnType<typeof signal<number>>;
    subtotal: ReturnType<typeof signal<number>>;
    total: ReturnType<typeof signal<number>>;
    load: ReturnType<typeof vi.fn>;
    updateQuantity: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
    clear: ReturnType<typeof vi.fn>;
  };

  function build(items: CartItem[]) {
    store = {
      items: signal(items),
      itemCount: signal(items.reduce((s, i) => s + i.quantity, 0)),
      subtotal: signal(items.reduce((s, i) => s + i.subtotal, 0)),
      total: signal(items.reduce((s, i) => s + i.subtotal, 0)),
      load: vi.fn(),
      updateQuantity: vi.fn().mockReturnValue(of(null)),
      remove: vi.fn().mockReturnValue(of(null)),
      clear: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [CartPage],
      providers: [
        provideRouter([]),
        provideTaiga(),
        { provide: TuiAlertService, useValue: { open: () => EMPTY } },
        { provide: CartStore, useValue: store },
      ],
    });

    fixture = TestBed.createComponent(CartPage);
    fixture.detectChanges();
  }

  it('loads the cart on init', () => {
    build([]);
    expect(store.load).toHaveBeenCalled();
  });

  it('shows the empty state when there are no lines', () => {
    build([]);
    expect(fixture.nativeElement.textContent).toContain('Tu carrito está vacío');
  });

  it('renders each line', () => {
    build([LINE]);
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Silla Ergonómica');
    expect(text).toContain('SKU-1');
  });

  it('the "+" button raises the quantity through the store', () => {
    build([LINE]);
    const inc = fixture.debugElement.query(By.css('button[aria-label="Aumentar cantidad"]'));
    inc.nativeElement.click();
    expect(store.updateQuantity).toHaveBeenCalledWith('p1', 3);
  });

  it('the "-" button lowers the quantity through the store', () => {
    build([LINE]);
    const dec = fixture.debugElement.query(By.css('button[aria-label="Disminuir cantidad"]'));
    dec.nativeElement.click();
    expect(store.updateQuantity).toHaveBeenCalledWith('p1', 1);
  });

  it('disables "-" at quantity 1 and "+" at the available limit', () => {
    build([{ ...LINE, quantity: 1, availableQuantity: 1 }]);
    const dec = fixture.debugElement.query(By.css('button[aria-label="Disminuir cantidad"]'));
    const inc = fixture.debugElement.query(By.css('button[aria-label="Aumentar cantidad"]'));
    expect(dec.nativeElement.disabled).toBe(true);
    expect(inc.nativeElement.disabled).toBe(true);
  });

  it('removes a line through the store', () => {
    build([LINE]);
    fixture.debugElement.query(By.css('.cart-line__remove')).nativeElement.click();
    expect(store.remove).toHaveBeenCalledWith('p1');
  });
});
