/** Wire-shape DTOs — mirror the backend's JSON exactly (camelCase via System.Text.Json). */

export interface ProfileResponseDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  createdAt: string;
}

export interface UpdateProfileRequestDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
}

/** Shape of the JSON body written by the backend's ExceptionHandlingMiddleware. */
export interface ApiProblemDto {
  status: number;
  title: string;
  errors?: Record<string, string[]> | null;
}
