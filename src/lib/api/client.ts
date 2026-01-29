/**
 * API Client
 * Base HTTP client for all API communication
 */

import { API_CONFIG } from '@/config/api.config';
import { interceptors } from './interceptors';
import type { ApiResponse, ApiError, RequestOptions, HttpMethod } from './types';

class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number;

  constructor(baseUrl: string = API_CONFIG.BASE_URL, timeout: number = API_CONFIG.TIMEOUT) {
    this.baseUrl = baseUrl;
    this.defaultTimeout = timeout;
  }

  // Build URL with query parameters
  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined | null>): string {
    const url = new URL(endpoint, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, String(value));
        }
      });
    }

    // Return relative path for same-origin requests
    return url.pathname + url.search;
  }

  // Create abort controller with timeout
  private createAbortController(timeout?: number): { controller: AbortController; timeoutId: NodeJS.Timeout } {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout || this.defaultTimeout);
    return { controller, timeoutId };
  }

  // Make HTTP request
  private async request<T>(
    method: HttpMethod,
    endpoint: string,
    data?: unknown,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { headers = {}, params, timeout, signal } = options;
    const url = this.buildUrl(`${this.baseUrl}${endpoint}`, params);

    // Create abort controller if no signal provided
    let abortController: AbortController | undefined;
    let timeoutId: NodeJS.Timeout | undefined;

    if (!signal) {
      const result = this.createAbortController(timeout);
      abortController = result.controller;
      timeoutId = result.timeoutId;
    }

    try {
      // Build request config
      let config: RequestInit = {
        method,
        headers: {
          ...headers,
        },
        signal: signal || abortController?.signal,
        credentials: 'include', // Include cookies for session auth
      };

      // Add body for non-GET requests
      if (data && method !== 'GET') {
        config.body = JSON.stringify(data);
      }

      // Run request interceptors
      config = await interceptors.runRequestInterceptors(config);

      // Make the request
      let response = await fetch(url, config);

      // Run response interceptors
      response = await interceptors.runResponseInterceptors(response);

      // Clear timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Parse response
      const contentType = response.headers.get('content-type');
      let responseData: T | undefined;

      if (contentType?.includes('application/json')) {
        const json = await response.json();
        // Handle both wrapped and unwrapped responses
        responseData = json.data !== undefined ? json.data : json;
      }

      // Handle error responses
      if (!response.ok) {
        const error: ApiError = {
          status: response.status,
          statusText: response.statusText,
          message: (responseData as { error?: string; message?: string })?.error ||
            (responseData as { error?: string; message?: string })?.message ||
            response.statusText,
        };

        const processedError = await interceptors.runErrorInterceptors(error);

        return {
          success: false,
          error: processedError.message,
        };
      }

      return {
        success: true,
        data: responseData,
      };
    } catch (err) {
      // Clear timeout on error
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Handle abort/timeout
      if (err instanceof DOMException && err.name === 'AbortError') {
        const error: ApiError = {
          status: 408,
          statusText: 'Request Timeout',
          message: 'Request timed out',
        };
        await interceptors.runErrorInterceptors(error);
        return {
          success: false,
          error: 'Request timed out',
        };
      }

      // Handle network errors
      const error: ApiError = {
        status: 0,
        statusText: 'Network Error',
        message: err instanceof Error ? err.message : 'Network error',
      };
      await interceptors.runErrorInterceptors(error);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  // HTTP Methods
  async get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  async post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, data, options);
  }

  async put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, data, options);
  }

  async patch<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, data, options);
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }

  // File upload helper
  async upload<T>(endpoint: string, formData: FormData, options?: RequestOptions): Promise<ApiResponse<T>> {
    const { headers = {}, params, timeout, signal } = options || {};
    const url = this.buildUrl(`${this.baseUrl}${endpoint}`, params);

    let abortController: AbortController | undefined;
    let timeoutId: NodeJS.Timeout | undefined;

    if (!signal) {
      const result = this.createAbortController(timeout);
      abortController = result.controller;
      timeoutId = result.timeoutId;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers, // Don't set Content-Type - browser will set it with boundary
        body: formData,
        signal: signal || abortController?.signal,
        credentials: 'include',
      });

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        return {
          success: false,
          error: json.error || json.message || response.statusText,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data !== undefined ? data.data : data,
      };
    } catch (err) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Upload failed',
      };
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for custom instances
export { ApiClient };
