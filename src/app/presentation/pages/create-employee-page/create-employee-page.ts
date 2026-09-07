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
  inject,
  output,
  signal,
} from '@angular/core';
import { TuiIcon } from '@taiga-ui/core';
import { CreateEmployeeForm } from '../../components/create-employee-form/create-employee-form';
import { CreateEmployeePayload, EmployeeApiError, FieldErrors, Role } from '../../../domain/models/employee.model';
import { EmployeeRepository } from '../../../domain/repositories/employee.repository';

/**
 * Modal content for provisioning an employee account (HU-02). Rendered by admin-users-page
 * inside an `@if`/`@defer` block driven by the `?create` query param — same pattern as
 * create-product-page over admin-products-page: the list underneath stays mounted and dimmed
 * rather than being navigated away from.
 */
@Component({
  selector: 'app-create-employee-page',
  imports: [CreateEmployeeForm, TuiIcon],
  templateUrl: './create-employee-page.html',
  styleUrl: './create-employee-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateEmployeePage implements OnInit, AfterViewInit, OnDestroy {
  private readonly employeeRepository = inject(EmployeeRepository);
  private readonly document = inject(DOCUMENT);

  @ViewChild('panel') private readonly panel?: ElementRef<HTMLElement>;

  /** Emitted on cancel, backdrop click, Escape, or successful create — parent clears `?create`. */
  readonly closed = output<void>();

  protected readonly roles = signal<Role[]>([]);
  protected readonly rolesError = signal<string | null>(null);
  protected readonly pending = signal(false);
  protected readonly fieldErrors = signal<FieldErrors | null>(null);
  protected readonly formError = signal<string | null>(null);

  constructor() {
    // Lock background scroll while the modal is open; restored in ngOnDestroy.
    this.document.body.style.overflow = 'hidden';
  }

  ngOnInit(): void {
    this.employeeRepository.getRoles().subscribe({
      next: (roles) => this.roles.set(roles),
      error: (error: EmployeeApiError) => this.rolesError.set(error.message),
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

  protected onSubmit(payload: CreateEmployeePayload): void {
    this.pending.set(true);
    this.fieldErrors.set(null);
    this.formError.set(null);

    this.employeeRepository.createEmployee(payload).subscribe({
      next: () => this.closed.emit(),
      error: (error: EmployeeApiError) => {
        this.pending.set(false);
        this.fieldErrors.set(error.fieldErrors ?? null);
        this.formError.set(error.fieldErrors ? null : error.message);
      },
    });
  }
}
