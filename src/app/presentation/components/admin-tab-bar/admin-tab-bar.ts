import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TuiDropdown, TuiIcon } from '@taiga-ui/core';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { visibleNavItems } from '../admin-nav-items';

/**
 * Bottom navigation for the admin panel below the mobile breakpoint (see `AdminSidebar`'s own
 * media query — the two swap in lockstep, never both visible). A bottom bar keeps every
 * destination inside thumb reach, which the sidebar's column of eight items never was on a phone.
 *
 * Bottom nav should stay at five destinations or fewer, so only the first four of
 * `ADMIN_NAV_ITEMS` get a column of their own; everything else (the remaining routes, the two
 * inert placeholders, and "Cerrar Sesión") sits behind the fifth "Más" column's dropdown instead
 * of redesigning the bar for eight entries.
 */
@Component({
  selector: 'app-admin-tab-bar',
  imports: [RouterLink, RouterLinkActive, TuiDropdown, TuiIcon],
  templateUrl: './admin-tab-bar.html',
  styleUrl: './admin-tab-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminTabBar {
  private readonly session = inject(AuthSessionService);
  private readonly router = inject(Router);

  private readonly items = computed(() => visibleNavItems((p) => this.session.hasPermission(p)));
  protected readonly primaryItems = computed(() => this.items().slice(0, 4));
  protected readonly overflowItems = computed(() => this.items().slice(4));

  protected readonly menuOpen = signal(false);

  protected onLogout(): void {
    this.menuOpen.set(false);
    this.session.clearSession();
    void this.router.navigateByUrl('/login');
  }
}
