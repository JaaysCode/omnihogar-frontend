import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideTaiga, TuiAlertService } from '@taiga-ui/core';
import { EMPTY, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ProductDetailPage } from './product-detail-page';
import { Product, ProductApiError } from '../../../domain/models/product.model';
import { CartApiError } from '../../../domain/models/cart.model';
import { ProductRepository } from '../../../domain/repositories/product.repository';
import { CartStore } from '../../../core/services/cart-store.service';
import { AuthSessionService } from '../../../core/services/auth-session.service';

const PRODUCT: Product = {
  id: 'p1',
  sku: 'SKU-1',
  name: 'Silla Ergonómica',
  description: 'Silla con soporte lumbar.',
  categoryId: null,
  price: 100,
  imageUrl: null,
  status: 'active',
  availableQuantity: 5,
  inStock: true,
};

describe('ProductDetailPage', () => {
  let fixture: ComponentFixture<ProductDetailPage>;
  let productRepository: { getById: ReturnType<typeof vi.fn> };
  let cartStore: { add: ReturnType<typeof vi.fn>; itemCount: ReturnType<typeof signal<number>> };
  let session: { isAuthenticated: ReturnType<typeof signal<boolean>>; isEmployee: ReturnType<typeof signal<boolean>> };
  let router: Router;

  function build(id = 'p1') {
    productRepository = { getById: vi.fn().mockReturnValue(of(PRODUCT)) };
    cartStore = { add: vi.fn().mockReturnValue(of({})), itemCount: signal(0) };
    session = { isAuthenticated: signal(true), isEmployee: signal(false) };

    TestBed.configureTestingModule({
      imports: [ProductDetailPage],
      providers: [
        provideRouter([]),
        provideTaiga(),
        { provide: TuiAlertService, useValue: { open: () => EMPTY } },
        { provide: ProductRepository, useValue: productRepository },
        { provide: CartStore, useValue: cartStore },
        { provide: AuthSessionService, useValue: session },
      ],
    });

    fixture = TestBed.createComponent(ProductDetailPage);
    fixture.componentRef.setInput('id', id);
    router = TestBed.inject(Router);
  }

  it('loads the product by id', () => {
    build('p1');
    fixture.detectChanges();

    expect(productRepository.getById).toHaveBeenCalledWith('p1');
    expect(fixture.nativeElement.textContent).toContain('Silla Ergonómica');
    expect(fixture.nativeElement.textContent).toContain('Silla con soporte lumbar.');
  });

  it('shows the load error banner when the product does not exist', () => {
    build('missing');
    productRepository.getById.mockReturnValue(throwError(() => new ProductApiError('El producto no existe.')));

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('El producto no existe.');
  });

  it('shows a not-available message and no add-to-cart button when out of stock', () => {
    build();
    productRepository.getById.mockReturnValue(of({ ...PRODUCT, availableQuantity: 0, inStock: false }));

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('no está disponible para compra');
    expect(fixture.nativeElement.querySelector('.detail__add')).toBeNull();
  });

  it('redirects to /login when adding to cart while signed out', () => {
    build();
    session.isAuthenticated.set(false);
    fixture.detectChanges();
    const navigateSpy = vi.spyOn(router, 'navigate');

    fixture.nativeElement.querySelector('.detail__add').click();

    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    expect(cartStore.add).not.toHaveBeenCalled();
  });

  it('adds the product to the cart when signed in', () => {
    build();
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.detail__add').click();

    expect(cartStore.add).toHaveBeenCalledWith('p1', 1);
  });

  it('shows an error toast when adding to cart fails', () => {
    build();
    cartStore.add.mockReturnValue(throwError(() => new CartApiError('No hay suficiente inventario.')));
    fixture.detectChanges();
    const alerts = TestBed.inject(TuiAlertService);
    const openSpy = vi.spyOn(alerts, 'open');

    fixture.nativeElement.querySelector('.detail__add').click();

    expect(openSpy).toHaveBeenCalledWith('No hay suficiente inventario.', { appearance: 'negative' });
  });
});
