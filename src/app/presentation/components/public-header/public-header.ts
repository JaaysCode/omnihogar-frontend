import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TuiButton, TuiDataList, TuiDropdown, TuiIcon } from '@taiga-ui/core';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { CartStore } from '../../../core/services/cart-store.service';

/**
 * Slim top bar for public pages (the catalog, the cart). Gives anonymous visitors a way
 * into `/login` / `/register`, signed-in customers a cart link (with an item-count badge) and
 * an account dropdown (profile, mis compras, cerrar sesión) off the profile icon, and staff a
 * shortcut to the admin area — same dropdown shape as admin-tab-bar's "Más" menu.
 */
@Component({
  selector: 'app-public-header',
  imports: [RouterLink, TuiButton, TuiDataList, TuiDropdown, TuiIcon],
  templateUrl: './public-header.html',
  styleUrl: './public-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicHeader {
  private readonly session = inject(AuthSessionService);
  private readonly cartStore = inject(CartStore);
  private readonly router = inject(Router);

  protected readonly isAuthenticated = this.session.isAuthenticated;
  protected readonly isEmployee = this.session.isEmployee;
  protected readonly cartCount = this.cartStore.itemCount;
  protected readonly menuOpen = signal(false);

  protected onLogout(): void {
    this.menuOpen.set(false);
    this.session.clearSession();
    this.cartStore.clear();
    void this.router.navigateByUrl('/login');
  }
}
