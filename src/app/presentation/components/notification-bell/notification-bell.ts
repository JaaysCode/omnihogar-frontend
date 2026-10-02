import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TuiDropdown, TuiIcon } from '@taiga-ui/core';
import { timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AppNotification } from '../../../domain/models/notification.model';
import { NotificationRepository } from '../../../domain/repositories/notification.repository';

const POLL_INTERVAL_MS = 30_000;
const MAX_BADGE_COUNT = 9;

/**
 * Topbar notification bell (HU-13) — a bell icon with an unread-count badge and a dropdown
 * listing every notification ("como en Jira"). Polls `/notifications` every 30s so new
 * despacho alerts show up without a manual refresh. Dropped into `AdminSidebar` (desktop) and
 * `AdminTabBar` (mobile) so it's visible across the whole admin area — the only two surfaces
 * every admin/despacho page renders.
 */
@Component({
  selector: 'app-notification-bell',
  imports: [TuiDropdown, TuiIcon, DatePipe],
  templateUrl: './notification-bell.html',
  styleUrl: './notification-bell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationBell implements OnInit {
  private readonly repository = inject(NotificationRepository);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly notifications = signal<AppNotification[]>([]);
  protected readonly open = signal(false);

  protected readonly unreadCount = computed(() => this.notifications().filter((n) => !n.isRead).length);
  protected readonly badgeLabel = computed(() => {
    const count = this.unreadCount();
    return count > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : `${count}`;
  });

  ngOnInit(): void {
    timer(0, POLL_INTERVAL_MS)
      .pipe(
        switchMap(() => this.repository.getMine()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (list) => this.notifications.set(list),
        // Silent — a failed poll just keeps showing the last-known list; the bell isn't worth
        // interrupting the viewer's work over.
        error: () => undefined,
      });
  }

  protected onSelect(notification: AppNotification): void {
    this.open.set(false);

    if (!notification.isRead) {
      this.notifications.update((list) =>
        list.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)),
      );
      this.repository.markRead(notification.id).subscribe({ error: () => undefined });
    }

    if (notification.orderId) {
      void this.router.navigate(['/admin/orders'], { queryParams: { order: notification.orderId } });
    }
  }

  protected onMarkAllRead(): void {
    if (this.unreadCount() === 0) {
      return;
    }

    this.notifications.update((list) => list.map((n) => ({ ...n, isRead: true })));
    this.repository.markAllRead().subscribe({ error: () => undefined });
  }
}
