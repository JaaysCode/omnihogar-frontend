import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TuiButton, TuiIcon } from '@taiga-ui/core';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { CartStore } from '../../../core/services/cart-store.service';

/**
 * Slim top bar for public pages (the catalog, the cart). Gives anonymous visitors a way
 * into `/login` / `/register`, signed-in customers a link to their cart (with an item-count
 * badge), and staff a shortcut to the admin area.
 */
@Component({
  selector: 'app-public-header',
  imports: [RouterLink, TuiButton, TuiIcon],
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

  protected onLogout(): void {
    this.session.clearSession();
    this.cartStore.clear();
    void this.router.navigateByUrl('/login');
  }
}
