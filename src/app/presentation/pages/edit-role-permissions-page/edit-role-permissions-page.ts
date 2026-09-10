import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { TuiAlertService, TuiButton, TuiIcon } from '@taiga-ui/core';
import { Permission, Role, RoleApiError } from '../../../domain/models/role.model';
import { RoleRepository } from '../../../domain/repositories/role.repository';

/**
 * Modal content for editing a role's allowed permissions (HU-31 crit. 3). Rendered by
 * admin-roles-page inside an `@if`/`@defer` block driven by the `?edit` query param — same
 * modal shell/backdrop/Escape/focus pattern as edit-product-page. On save the backend revokes
 * the refresh tokens of every employee holding this role, so their claims refresh on re-login.
 */
@Component({
  selector: 'app-edit-role-permissions-page',
  imports: [TuiButton, TuiIcon],
  templateUrl: './edit-role-permissions-page.html',
  styleUrl: './edit-role-permissions-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditRolePermissionsPage implements OnInit, AfterViewInit, OnDestroy {
  private readonly roleRepository = inject(RoleRepository);
  private readonly document = inject(DOCUMENT);
  private readonly alerts = inject(TuiAlertService);

  /** Role id to load — required, set from the parent's `?edit` query param. */
  readonly roleId = input.required<string>();

  /** Emitted on close button, backdrop click, Escape, or successful update — parent clears `?edit`. */
  readonly closed = output<void>();

  @ViewChild('panel') private readonly panel?: ElementRef<HTMLElement>;

  protected readonly role = signal<Role | null>(null);
  protected readonly permissions = signal<Permission[]>([]);
  protected readonly selected = signal<ReadonlySet<string>>(new Set());
  protected readonly loadError = signal<string | null>(null);
  protected readonly pending = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly ready = computed(() => this.role() !== null && this.permissions().length > 0);

  constructor() {
    // Lock background scroll while the modal is open; restored in ngOnDestroy.
    this.document.body.style.overflow = 'hidden';
  }

  ngOnInit(): void {
    this.roleRepository.getPermissions().subscribe({
      next: (permissions) => this.permissions.set(permissions),
      error: (error: RoleApiError) => this.loadError.set(error.message),
    });

    this.roleRepository.getRoles().subscribe({
      next: (roles) => {
        const match = roles.find((r) => r.id === this.roleId());
        if (!match) {
          this.loadError.set($localize`:@@roles.error.notFound:El rol solicitado no existe.`);
          return;
        }
        this.role.set(match);
        this.selected.set(new Set(match.permissions));
      },
      error: (error: RoleApiError) => this.loadError.set(error.message),
    });
  }

  ngAfterViewInit(): void {
    // Move focus into the dialog so screen readers announce it and Tab stays sensible.
    this.panel?.nativeElement.focus();
  }

  ngOnDestroy(): void {
    this.document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  protected close(): void {
    this.closed.emit();
  }

  protected isChecked(name: string): boolean {
    return this.selected().has(name);
  }

  protected toggle(name: string): void {
    this.selected.update((current) => {
      const next = new Set(current);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }

  protected onSubmit(): void {
    const current = this.role();
    if (!current) {
      return;
    }

    this.pending.set(true);
    this.formError.set(null);

    this.roleRepository.updateRolePermissions(current.id, [...this.selected()]).subscribe({
      next: () => {
        this.alerts
          .open($localize`:@@roles.edit.success:Permisos actualizados. El personal los verá al volver a iniciar sesión.`, {
            appearance: 'positive',
          })
          .subscribe();
        this.closed.emit();
      },
      error: (error: RoleApiError) => {
        this.pending.set(false);
        this.formError.set(error.message);
      },
    });
  }
}
