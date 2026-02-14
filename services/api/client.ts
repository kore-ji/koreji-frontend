/**
 * Base API client for making HTTP requests to the backend
 *
 * This module provides a type-safe HTTP client with comprehensive error handling
 * for GET, POST, PUT, and DELETE operations. It follows Expo best practices for
 * environment variable access and handles network failures gracefully.
 */

/**
 * Error types that can occur during API requests
 */
export enum ApiErrorType {
  /** Network connectivity issue (no internet, DNS failure, etc.) */
  NETWORK = 'NETWORK',
  /** HTTP error response (4xx, 5xx status codes) */
  HTTP = 'HTTP',
  /** JSON parsing error */
  PARSE = 'PARSE',
  /** Request timeout */
  TIMEOUT = 'TIMEOUT',
  /** Configuration error (missing API base URL) */
  CONFIG = 'CONFIG',
  /** Unknown/unexpected error */
  UNKNOWN = 'UNKNOWN',
}

/**
 * Structured error information for API failures
 */
export interface ApiError {
  /** Human-readable error message */
  message: string;
  /** Error type category */
  type: ApiErrorType;
  /** HTTP status code (if applicable) */
  status?: number;
  /** Response body data (if available) */
  data?: unknown;
  /** Original error object (if available) */
  originalError?: unknown;
}

/**
 * Custom error class for API client failures
 *
 * Provides structured error information including HTTP status codes,
 * response data, and error type classification for better error handling.
 */
export class ApiClientError extends Error implements ApiError {
  readonly type: ApiErrorType;
  readonly status?: number;
  readonly data?: unknown;
  readonly originalError?: unknown;

  constructor(
    message: string,
    type: ApiErrorType,
    status?: number,
    data?: unknown,
    originalError?: unknown
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.type = type;
    this.status = status;
    this.data = data;
    this.originalError = originalError;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiClientError);
    }
  }
}

/**
 * Gets the API base URL from environment variables
 *
 * In Expo, environment variables prefixed with EXPO_PUBLIC_ are available
 * in the client-side code. This follows Expo's best practices for
 * accessing environment variables in React Native apps.
 *
 * @returns The API base URL, or empty string if not configured
 * @throws ApiClientError if API_BASE_URL is required but not set (can be configured)
 */
const getApiBaseUrl = (): string => {
  // Expo convention: EXPO_PUBLIC_ prefix makes env vars available in client code
  // Fallback to API_BASE_URL for backward compatibility and testing
  const apiBaseUrl =
    process.env.EXPO_PUBLIC_API_BASE_URL || process.env.API_BASE_URL;

  if (!apiBaseUrl) {
    // Return empty string to allow app to run during development
    // The error will be thrown when an actual request is made
    return '';
  }

  // Ensure URL doesn't end with a slash to avoid double slashes
  return apiBaseUrl.replace(/\/$/, '');
};

/**
 * Type constraint for request bodies - must be JSON-serializable
 *
 * This type allows any value that can be safely passed to JSON.stringify().
 * We use a flexible constraint that accepts:
 * - Primitives (string, number, boolean, null, undefined)
 * - Arrays of JSON-serializable values
 * - Objects (including TypeScript interfaces and types)
 * - Nested combinations of the above
 *
 * The runtime validation in stringifyBody() ensures only valid JSON is sent.
 */
type JsonSerializable =
  | string
  | number
  | boolean
  | null
  | undefined
  | JsonSerializable[]
  | { readonly [key: string]: JsonSerializable | unknown }
  | object; // Allow any object type (interfaces, classes, etc.)

/**
 * Safely stringifies a request body to JSON
 *
 * @param body - The body to stringify
 * @returns JSON string representation
 * @throws ApiClientError if body cannot be serialized
 */
function stringifyBody(body: unknown): string {
  try {
    return JSON.stringify(body);
  } catch (error) {
    throw new ApiClientError(
      `Failed to serialize request body: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ApiErrorType.PARSE,
      undefined,
      undefined,
      error
    );
  }
}

/**
 * Parses the response body based on content type
 *
 * @param response - The fetch Response object
 * @returns Parsed response data
 * @throws ApiClientError if parsing fails
 */
async function parseResponse<T>(response: Response): Promise<T> {
  // Handle empty responses (e.g., 204 No Content, 205 Reset Content)
  if (response.status === 204 || response.status === 205) {
    return {} as T;
  }

  // Check if response has content
  const contentLength = response.headers.get('content-length');
  if (contentLength === '0') {
    return {} as T;
  }

  // Get content type to determine parsing strategy
  const contentType = response.headers.get('content-type') || '';

  // Handle JSON responses
  if (contentType.includes('application/json')) {
    try {
      const text = await response.text();
      if (!text.trim()) {
        return {} as T;
      }
      return JSON.parse(text) as T;
    } catch (error) {
      throw new ApiClientError(
        `Failed to parse JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ApiErrorType.PARSE,
        response.status,
        undefined,
        error
      );
    }
  }

  // Handle text responses
  if (contentType.includes('text/')) {
    const text = await response.text();
    // Try to parse as JSON if it looks like JSON
    if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
      try {
        return JSON.parse(text) as T;
      } catch {
        // If parsing fails, return as string (wrapped in object for type safety)
        return { data: text } as T;
      }
    }
    return { data: text } as T;
  }

  // For other content types, try to parse as JSON, fallback to empty object
  try {
    const text = await response.text();
    if (text.trim()) {
      return JSON.parse(text) as T;
    }
  } catch {
    // Ignore parsing errors for unknown content types
  }

  return {} as T;
}

/**
 * Creates an AbortController with a timeout
 *
 * This utility function helps implement request timeouts by creating an
 * AbortController that automatically aborts after the specified duration.
 * The returned signal should be passed to the fetch options.
 *
 * @param timeoutMs - Timeout duration in milliseconds
 * @returns Object containing the AbortController and its signal
 *
 * @example
 * ```ts
 * const { signal } = createTimeoutSignal(5000); // 5 second timeout
 * const data = await get('/api/data', { signal });
 * ```
 */
export function createTimeoutSignal(timeoutMs: number): {
  controller: AbortController;
  signal: AbortSignal;
} {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  // Clean up timeout if signal is already aborted
  // This prevents memory leaks if the request completes before timeout
  controller.signal.addEventListener('abort', () => {
    clearTimeout(timeoutId);
  });

  return { controller, signal: controller.signal };
}

/**
 * Extracts error data from a failed HTTP response
 *
 * @param response - The failed Response object
 * @returns Error data from response body
 */
async function extractErrorData(response: Response): Promise<unknown> {
  try {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return await response.json();
    }
    const text = await response.text();
    // Try to parse as JSON even if content-type doesn't indicate JSON
    if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    }
    return text;
  } catch {
    // If all parsing fails, return null
    return null;
  }
}

/**
 * Internal helper function to make HTTP requests and handle responses
 *
 * This function centralizes all HTTP request logic, error handling, and response
 * parsing. It provides consistent error types and handles edge cases like
 * network failures, timeouts, and malformed responses.
 *
 * @param endpoint - API endpoint path (e.g., '/api/users')
 * @param method - HTTP method (GET, POST, PUT, DELETE)
 * @param body - Request body (will be JSON stringified)
 * @param options - Additional fetch options (headers, timeout, etc.)
 * @returns Promise resolving to the typed response
 * @throws ApiClientError for any request failures
 */
async function request<TResponse = unknown>(
  endpoint: string,
  method: string,
  body?: JsonSerializable,
  options?: RequestInit
): Promise<TResponse> {
  // Validate API base URL configuration
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new ApiClientError(
      'API base URL is not configured. Please set EXPO_PUBLIC_API_BASE_URL environment variable.',
      ApiErrorType.CONFIG
    );
  }

  // Normalize endpoint (ensure it starts with /)
  const normalizedEndpoint = endpoint.startsWith('/')
    ? endpoint
    : `/${endpoint}`;
  const url = `${baseUrl}${normalizedEndpoint}`;

  // Prepare request configuration
  // Extract headers and other options, excluding body (which we handle separately)
  const { body: _ignoredBody, headers, ...restOptions } = options || {};

  const requestConfig: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...restOptions,
  };

  // Add body if provided
  if (body !== undefined && body !== null) {
    requestConfig.body = stringifyBody(body);
  }

  try {
    // Make the HTTP request
    const response = await fetch(url, requestConfig);

    // Handle HTTP error responses (4xx, 5xx)
    if (!response.ok) {
      const errorData = await extractErrorData(response);
      const errorMessage =
        errorData && typeof errorData === 'object' && 'message' in errorData
          ? String(errorData.message)
          : `API request failed: ${response.statusText || `HTTP ${response.status}`}`;

      throw new ApiClientError(
        errorMessage,
        ApiErrorType.HTTP,
        response.status,
        errorData
      );
    }

    // Parse successful response
    return await parseResponse<TResponse>(response);
  } catch (error) {
    // Re-throw ApiClientError instances as-is
    if (error instanceof ApiClientError) {
      throw error;
    }

    // Handle network errors (no internet, DNS failure, etc.)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiClientError(
        'Network request failed. Please check your internet connection.',
        ApiErrorType.NETWORK,
        undefined,
        undefined,
        error
      );
    }

    // Handle AbortError (timeout or manual abort)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiClientError(
        'Request timeout or aborted',
        ApiErrorType.TIMEOUT,
        undefined,
        undefined,
        error
      );
    }

    // Handle unknown errors
    throw new ApiClientError(
      `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ApiErrorType.UNKNOWN,
      undefined,
      undefined,
      error
    );
  }
}

/**
 * Makes a GET request to the API
 *
 * @param endpoint - API endpoint path (e.g., '/api/users')
 * @param options - Optional fetch options (headers, timeout via signal, etc.)
 * @returns Promise resolving to the typed response
 * @throws ApiClientError if the request fails
 *
 * @example
 * ```ts
 * // Basic request
 * const users = await get<User[]>('/api/users');
 *
 * // Request with timeout
 * const { signal } = createTimeoutSignal(5000);
 * const users = await get<User[]>('/api/users', { signal });
 * ```
 */
export async function get<TResponse = unknown>(
  endpoint: string,
  options?: RequestInit
): Promise<TResponse> {
  return request<TResponse>(endpoint, 'GET', undefined, options);
}

/**
 * Makes a POST request to the API
 *
 * @param endpoint - API endpoint path (e.g., '/api/users')
 * @param body - Request body (will be JSON stringified)
 * @param options - Optional fetch options (headers, timeout via signal, etc.)
 * @returns Promise resolving to the typed response
 * @throws ApiClientError if the request fails
 *
 * @example
 * ```ts
 * // Basic request
 * const newUser = await post<User, CreateUserRequest>('/api/users', {
 *   name: 'John Doe',
 *   email: 'john@example.com'
 * });
 *
 * // Request with timeout
 * const { signal } = createTimeoutSignal(10000);
 * const newUser = await post<User, CreateUserRequest>('/api/users', data, { signal });
 * ```
 */
export async function post<
  TResponse = unknown,
  TBody extends JsonSerializable = JsonSerializable,
>(endpoint: string, body: TBody, options?: RequestInit): Promise<TResponse> {
  return request<TResponse>(endpoint, 'POST', body, options);
}

/**
 * Makes a PUT request to the API
 *
 * @param endpoint - API endpoint path (e.g., '/api/users/123')
 * @param body - Request body (will be JSON stringified)
 * @param options - Optional fetch options (headers, timeout via signal, etc.)
 * @returns Promise resolving to the typed response
 * @throws ApiClientError if the request fails
 *
 * @example
 * ```ts
 * // Basic request
 * const updatedUser = await put<User, UpdateUserRequest>('/api/users/123', {
 *   name: 'Jane Doe'
 * });
 *
 * // Request with timeout
 * const { signal } = createTimeoutSignal(10000);
 * const updatedUser = await put<User, UpdateUserRequest>('/api/users/123', data, { signal });
 * ```
 */
export async function put<
  TResponse = unknown,
  TBody extends JsonSerializable = JsonSerializable,
>(endpoint: string, body: TBody, options?: RequestInit): Promise<TResponse> {
  return request<TResponse>(endpoint, 'PUT', body, options);
}

/**
 * Makes a PATCH request to the API
 *
 * @param endpoint - API endpoint path (e.g., '/api/users/123')
 * @param body - Request body (will be JSON stringified)
 * @param options - Optional fetch options (headers, timeout via signal, etc.)
 * @returns Promise resolving to the typed response
 * @throws ApiClientError if the request fails
 *
 * @example
 * ```ts
 * // Basic request
 * const updatedUser = await patch<User, UpdateUserRequest>('/api/users/123', {
 *   name: 'Jane Doe'
 * });
 *
 * // Request with timeout
 * const { signal } = createTimeoutSignal(10000);
 * const updatedUser = await patch<User, UpdateUserRequest>('/api/users/123', data, { signal });
 * ```
 */
export async function patch<
  TResponse = unknown,
  TBody extends JsonSerializable = JsonSerializable,
>(endpoint: string, body: TBody, options?: RequestInit): Promise<TResponse> {
  return request<TResponse>(endpoint, 'PATCH', body, options);
}

/**
 * Makes a DELETE request to the API
 *
 * @param endpoint - API endpoint path (e.g., '/api/users/123')
 * @param body - Optional request body (will be JSON stringified)
 * @param options - Optional fetch options (headers, timeout via signal, etc.)
 * @returns Promise resolving to the typed response
 * @throws ApiClientError if the request fails
 *
 * @example
 * ```ts
 * // DELETE without body
 * await del('/api/users/123');
 *
 * // DELETE with body (some APIs require this)
 * await del<DeleteResponse, DeleteRequest>('/api/users/123', {
 *   reason: 'No longer needed'
 * });
 *
 * // DELETE with timeout
 * const { signal } = createTimeoutSignal(5000);
 * await del('/api/users/123', undefined, { signal });
 * ```
 */
export async function del<
  TResponse = unknown,
  TBody extends JsonSerializable = JsonSerializable,
>(endpoint: string, body?: TBody, options?: RequestInit): Promise<TResponse> {
  return request<TResponse>(endpoint, 'DELETE', body, options);
}
