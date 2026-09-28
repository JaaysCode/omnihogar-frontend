import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ProfileRepositoryImpl } from './profile.repository.impl';
import { ProfileApiService } from '../services/profile-api.service';
import { ProfileApiError } from '../../domain/models/profile.model';

describe('ProfileRepositoryImpl', () => {
  let repository: ProfileRepositoryImpl;
  let api: { getMine: ReturnType<typeof vi.fn>; updateMine: ReturnType<typeof vi.fn> };

  const dto = {
    id: 'u1',
    firstName: 'Ana',
    lastName: 'Gómez',
    email: 'ana@x.test',
    phone: '3001234567',
    createdAt: '2026-01-15T00:00:00Z',
  };

  beforeEach(() => {
    api = { getMine: vi.fn(), updateMine: vi.fn() };
    TestBed.configureTestingModule({
      providers: [ProfileRepositoryImpl, { provide: ProfileApiService, useValue: api }],
    });
    repository = TestBed.inject(ProfileRepositoryImpl);
  });

  it('maps a successful getMyProfile response to a domain Profile', () => {
    api.getMine.mockReturnValue(of(dto));

    let profile;
    repository.getMyProfile().subscribe((p) => (profile = p));

    expect(profile).toEqual(dto);
  });

  it('translates a failed getMyProfile call into a ProfileApiError', () => {
    api.getMine.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401 })));

    let caught: ProfileApiError | undefined;
    repository.getMyProfile().subscribe({ error: (err) => (caught = err) });

    expect(caught).toBeInstanceOf(ProfileApiError);
    expect(caught?.message).toBe('Tu sesión expiró. Inicia sesión de nuevo.');
  });

  it('maps a successful updateMyProfile response to a domain Profile', () => {
    api.updateMine.mockReturnValue(of({ ...dto, firstName: 'Ana María' }));

    let profile;
    repository
      .updateMyProfile({ firstName: 'Ana María', lastName: 'Gómez', email: 'ana@x.test', phone: '3001234567' })
      .subscribe((p) => (profile = p));

    expect(profile).toEqual({ ...dto, firstName: 'Ana María' });
  });

  it('translates a failed updateMyProfile call into a ProfileApiError with field errors', () => {
    api.updateMine.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { status: 400, title: 'Validation failed', errors: { FirstName: ['El nombre es obligatorio.'] } },
          }),
      ),
    );

    let caught: ProfileApiError | undefined;
    repository
      .updateMyProfile({ firstName: '', lastName: 'Gómez', email: 'ana@x.test', phone: null })
      .subscribe({ error: (err) => (caught = err) });

    expect(caught?.fieldErrors).toEqual({ firstName: ['El nombre es obligatorio.'] });
  });
});
