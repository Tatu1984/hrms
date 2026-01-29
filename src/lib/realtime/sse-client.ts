/**
 * SSE Client
 * Server-Sent Events client for real-time updates
 * Compatible with NeonDB's serverless architecture
 */

import type {
  SSEConnectionState,
  SSEEventType,
  SSEEvent,
  SSEClientOptions,
  SSEEventHandler,
  SSEErrorHandler,
  SSEStateChangeHandler,
  SSESubscription,
} from './types';

class SSEClient {
  private eventSource: EventSource | null = null;
  private url: string;
  private options: Required<Omit<SSEClientOptions, 'url'>>;
  private state: SSEConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  // Event handlers
  private eventHandlers: Map<SSEEventType | '*', Set<SSEEventHandler>> = new Map();
  private errorHandlers: Set<SSEErrorHandler> = new Set();
  private stateChangeHandlers: Set<SSEStateChangeHandler> = new Set();

  constructor(options: SSEClientOptions) {
    this.url = options.url;
    this.options = {
      reconnect: options.reconnect ?? true,
      reconnectInterval: options.reconnectInterval ?? 3000,
      maxReconnectAttempts: options.maxReconnectAttempts ?? 5,
      withCredentials: options.withCredentials ?? true,
      headers: options.headers ?? {},
    };
  }

  /**
   * Connect to SSE endpoint
   */
  connect(): void {
    if (this.eventSource) {
      this.disconnect();
    }

    this.setState('connecting');

    try {
      this.eventSource = new EventSource(this.url, {
        withCredentials: this.options.withCredentials,
      });

      this.eventSource.onopen = () => {
        this.setState('connected');
        this.reconnectAttempts = 0;
      };

      this.eventSource.onmessage = (event) => {
        this.handleMessage(event);
      };

      this.eventSource.onerror = () => {
        this.handleError(new Error('SSE connection error'));
      };

      // Listen for specific event types
      const eventTypes: SSEEventType[] = [
        'attendance',
        'notification',
        'message',
        'task_update',
        'leave_update',
        'system',
        'heartbeat',
      ];

      eventTypes.forEach((type) => {
        this.eventSource?.addEventListener(type, (event: MessageEvent) => {
          this.handleTypedEvent(type, event);
        });
      });
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error('Failed to connect'));
    }
  }

  /**
   * Disconnect from SSE endpoint
   */
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.setState('disconnected');
    this.reconnectAttempts = 0;
  }

  /**
   * Subscribe to specific event type
   */
  on<T = unknown>(eventType: SSEEventType | '*', handler: SSEEventHandler<T>): SSESubscription {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }

    this.eventHandlers.get(eventType)!.add(handler as SSEEventHandler);

    return {
      unsubscribe: () => {
        this.eventHandlers.get(eventType)?.delete(handler as SSEEventHandler);
      },
    };
  }

  /**
   * Subscribe to errors
   */
  onError(handler: SSEErrorHandler): SSESubscription {
    this.errorHandlers.add(handler);

    return {
      unsubscribe: () => {
        this.errorHandlers.delete(handler);
      },
    };
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(handler: SSEStateChangeHandler): SSESubscription {
    this.stateChangeHandlers.add(handler);

    return {
      unsubscribe: () => {
        this.stateChangeHandlers.delete(handler);
      },
    };
  }

  /**
   * Get current connection state
   */
  getState(): SSEConnectionState {
    return this.state;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.state === 'connected';
  }

  // Private methods

  private setState(newState: SSEConnectionState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.stateChangeHandlers.forEach((handler) => handler(newState));
    }
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data) as SSEEvent;
      this.dispatchEvent(data);
    } catch (error) {
      console.error('[SSE] Failed to parse message:', error);
    }
  }

  private handleTypedEvent(type: SSEEventType, event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      const sseEvent: SSEEvent = {
        type,
        timestamp: new Date().toISOString(),
        data,
      };
      this.dispatchEvent(sseEvent);
    } catch (error) {
      console.error(`[SSE] Failed to parse ${type} event:`, error);
    }
  }

  private dispatchEvent(event: SSEEvent): void {
    // Dispatch to specific type handlers
    this.eventHandlers.get(event.type)?.forEach((handler) => {
      try {
        handler(event);
      } catch (error) {
        console.error('[SSE] Event handler error:', error);
      }
    });

    // Dispatch to wildcard handlers
    this.eventHandlers.get('*')?.forEach((handler) => {
      try {
        handler(event);
      } catch (error) {
        console.error('[SSE] Wildcard handler error:', error);
      }
    });
  }

  private handleError(error: Error): void {
    this.setState('error');

    // Notify error handlers
    this.errorHandlers.forEach((handler) => {
      try {
        handler(error);
      } catch (e) {
        console.error('[SSE] Error handler error:', e);
      }
    });

    // Attempt reconnection
    if (this.options.reconnect && this.reconnectAttempts < this.options.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `[SSE] Reconnecting in ${this.options.reconnectInterval}ms (attempt ${this.reconnectAttempts}/${this.options.maxReconnectAttempts})`
      );

      this.reconnectTimeout = setTimeout(() => {
        this.connect();
      }, this.options.reconnectInterval);
    } else if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      console.error('[SSE] Max reconnection attempts reached');
      this.disconnect();
    }
  }
}

// Factory function for creating SSE client
export function createSSEClient(options: SSEClientOptions): SSEClient {
  return new SSEClient(options);
}

// Default SSE endpoint
const DEFAULT_SSE_URL = '/api/realtime/events';

// Singleton instance for app-wide use
let defaultClient: SSEClient | null = null;

export function getSSEClient(url: string = DEFAULT_SSE_URL): SSEClient {
  if (!defaultClient) {
    defaultClient = createSSEClient({ url });
  }
  return defaultClient;
}

export function closeSSEClient(): void {
  if (defaultClient) {
    defaultClient.disconnect();
    defaultClient = null;
  }
}

export { SSEClient };
