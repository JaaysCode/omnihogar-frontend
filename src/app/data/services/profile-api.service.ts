import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api.config';
import { UpdateProfilePayload } from '../../domain/models/profile.model';
import { ProfileResponseDto, UpdateProfileRequestDto } from './profile-api.dto';

/**
 * Raw HTTP client for the `/profile` endpoints. Transport-only: no error translation,
 * no domain mapping — see `ProfileRepositoryImpl` for that.
 */
@Injectable({ providedIn: 'root' })
export class ProfileApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getMine(): Observable<ProfileResponseDto> {
    return this.http.get<ProfileResponseDto>(`${this.baseUrl}/profile`);
  }

  updateMine(payload: UpdateProfilePayload): Observable<ProfileResponseDto> {
    const body: UpdateProfileRequestDto = {
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      phone: payload.phone ?? null,
    };
    return this.http.put<ProfileResponseDto>(`${this.baseUrl}/profile`, body);
  }
}
