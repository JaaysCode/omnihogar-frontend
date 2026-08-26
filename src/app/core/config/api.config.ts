import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

/** Base URL for the OmniHogar backend API. Overridable in tests via a custom provider. */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => environment.apiBaseUrl,
});
