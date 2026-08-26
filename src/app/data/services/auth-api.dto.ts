/** Wire-shape DTOs — mirror the backend's JSON exactly (camelCase via System.Text.Json). */

export interface RegisterRequestDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresAtUtc: string;
}

/** Shape of the JSON body written by the backend's ExceptionHandlingMiddleware. */
export interface ApiProblemDto {
  status: number;
  title: string;
  errors?: Record<string, string[]> | null;
}
