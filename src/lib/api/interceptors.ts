/**
 * API Interceptors
 * Request and response interceptors for the API client
 */

import type { ApiError } from './types';

// Request interceptor type
export type RequestInterceptor = (config: RequestInit) => RequestInit | Promise<RequestInit>;

// Response interceptor type
export type ResponseInterceptor = (response: Response) => Response | Promise<Response>;

// Error interceptor type
export type ErrorInterceptor = (error: ApiError) => ApiError | Promise<ApiError>;

// Collection of interceptors
class InterceptorManager {
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  // Add request interceptor
  addRequestInterceptor(interceptor: RequestInterceptor): () => void {
    this.requestInterceptors.push(interceptor);
    return () => {
      const index = this.requestInterceptors.indexOf(interceptor);
      if (index !== -1) {
        this.requestInterceptors.splice(index, 1);
      }
    };
  }

  // Add response interceptor
  addResponseInterceptor(interceptor: ResponseInterceptor): () => void {
    this.responseInterceptors.push(interceptor);
    return () => {
      const index = this.responseInterceptors.indexOf(interceptor);
      if (index !== -1) {
        this.responseInterceptors.splice(index, 1);
      }
    };
  }

  // Add error interceptor
  addErrorInterceptor(interceptor: ErrorInterceptor): () => void {
    this.errorInterceptors.push(interceptor);
    return () => {
      const index = this.errorInterceptors.indexOf(interceptor);
      if (index !== -1) {
        this.errorInterceptors.splice(index, 1);
      }
    };
  }

  // Run request interceptors
  async runRequestInterceptors(config: RequestInit): Promise<RequestInit> {
    let result = config;
    for (const interceptor of this.requestInterceptors) {
      result = await interceptor(result);
    }
    return result;
  }

  // Run response interceptors
  async runResponseInterceptors(response: Response): Promise<Response> {
    let result = response;
    for (const interceptor of this.responseInterceptors) {
      result = await interceptor(result);
    }
    return result;
  }

  // Run error interceptors
  async runErrorInterceptors(error: ApiError): Promise<ApiError> {
    let result = error;
    for (const interceptor of this.errorInterceptors) {
      result = await interceptor(result);
    }
    return result;
  }
}

// Singleton instance
export const interceptors = new InterceptorManager();

// Default request interceptor - adds common headers
export const defaultRequestInterceptor: RequestInterceptor = (config) => {
  return {
    ...config,
    headers: {
      'Content-Type': 'application/json',
      ...config.headers,
    },
  };
};

// Default response interceptor - logs in development
export const devLoggingInterceptor: ResponseInterceptor = (response) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[API] ${response.status} ${response.url}`);
  }
  return response;
};

// Default error interceptor - handles common errors
export const defaultErrorInterceptor: ErrorInterceptor = (error) => {
  // Handle authentication errors
  if (error.status === 401) {
    // Could dispatch to auth state or redirect
    console.warn('[API] Unauthorized - session may have expired');
  }

  // Handle forbidden errors
  if (error.status === 403) {
    console.warn('[API] Forbidden - insufficient permissions');
  }

  // Handle server errors
  if (error.status >= 500) {
    console.error('[API] Server error:', error.message);
  }

  return error;
};

// Initialize default interceptors
interceptors.addRequestInterceptor(defaultRequestInterceptor);
interceptors.addErrorInterceptor(defaultErrorInterceptor);
