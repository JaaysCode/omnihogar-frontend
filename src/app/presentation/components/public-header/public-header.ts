import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TuiButton } from '@taiga-ui/core';
import { AuthSessionService } from '../../../core/services/auth-session.service';

/**
 * Slim top bar for public pages (the catalog). Gives anonymous visitors a way into
 * `/login` / `/register` — otherwise those routes are only reachable by typing the URL —
 * and signed-in customers a way to reach the admin area (if staff) or sign out.
 */
@Component({
  selector: 'app-public-header',
  imports: [RouterLink, TuiButton],
  templateUrl: './public-header.html',
  styleUrl: './public-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicHeader {
  private readonly session = inject(AuthSessionService);
  private readonly router = inject(Router);

  protected readonly isAuthenticated = this.session.isAuthenticated;
  protected readonly isEmployee = this.session.isEmployee;

  protected onLogout(): void {
    this.session.clearSession();
    void this.router.navigateByUrl('/login');
  }
}
