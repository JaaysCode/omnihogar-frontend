import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TuiIcon } from '@taiga-ui/core';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { visibleNavItems } from '../admin-nav-items';

/**
 * Left navigation for the admin panel — desktop only, see class doc on `AdminTabBar` for the
 * bottom-bar counterpart that takes over below the mobile breakpoint. Destinations live in
 * `ADMIN_NAV_ITEMS` (shared with `AdminTabBar`) so the two never drift apart.
 */
@Component({
  selector: 'app-admin-sidebar',
  imports: [RouterLink, RouterLinkActive, TuiIcon],
  templateUrl: './admin-sidebar.html',
  styleUrl: './admin-sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSidebar {
  private readonly session = inject(AuthSessionService);
  private readonly router = inject(Router);

  protected readonly navItems = computed(() => visibleNavItems((p) => this.session.hasPermission(p)));

  protected onLogout(): void {
    this.session.clearSession();
    void this.router.navigateByUrl('/login');
  }
}
