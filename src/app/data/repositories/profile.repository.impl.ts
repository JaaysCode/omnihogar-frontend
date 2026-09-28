import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { ProfileRepository } from '../../domain/repositories/profile.repository';
import { Profile, UpdateProfilePayload } from '../../domain/models/profile.model';
import { toProfile, toProfileApiError } from '../mappers/profile.mapper';
import { ProfileApiService } from '../services/profile-api.service';

@Injectable({ providedIn: 'root' })
export class ProfileRepositoryImpl implements ProfileRepository {
  private readonly api = inject(ProfileApiService);

  getMyProfile(): Observable<Profile> {
    return this.api.getMine().pipe(
      map(toProfile),
      catchError((error) => throwError(() => toProfileApiError(error))),
    );
  }

  updateMyProfile(payload: UpdateProfilePayload): Observable<Profile> {
    return this.api.updateMine(payload).pipe(
      map(toProfile),
      catchError((error) => throwError(() => toProfileApiError(error))),
    );
  }
}
