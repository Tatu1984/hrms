/**
 * SSE Realtime Types
 * Type definitions for Server-Sent Events
 */

// Connection states
export type SSEConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

// Event types
export type SSEEventType =
  | 'attendance'
  | 'notification'
  | 'message'
  | 'task_update'
  | 'leave_update'
  | 'system'
  | 'heartbeat';

// Base event structure
export interface SSEEvent<T = unknown> {
  type: SSEEventType;
  timestamp: string;
  data: T;
}

// Specific event payloads
export interface AttendanceEvent {
  employeeId: string;
  action: 'punch_in' | 'punch_out' | 'break_start' | 'break_end';
  timestamp: string;
}

export interface NotificationEvent {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
}

export interface MessageEvent {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
}

export interface TaskUpdateEvent {
  taskId: string;
  action: 'created' | 'updated' | 'deleted' | 'status_changed';
  taskTitle: string;
  updatedBy: string;
}

export interface LeaveUpdateEvent {
  leaveId: string;
  employeeId: string;
  action: 'submitted' | 'approved' | 'rejected' | 'cancelled';
  updatedBy: string;
}

export interface SystemEvent {
  level: 'info' | 'warning' | 'critical';
  message: string;
}

export interface HeartbeatEvent {
  serverTime: string;
}

// SSE Client options
export interface SSEClientOptions {
  url: string;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  withCredentials?: boolean;
  headers?: Record<string, string>;
}

// Event handler types
export type SSEEventHandler<T = unknown> = (event: SSEEvent<T>) => void;
export type SSEErrorHandler = (error: Error) => void;
export type SSEStateChangeHandler = (state: SSEConnectionState) => void;

// Subscription
export interface SSESubscription {
  unsubscribe: () => void;
}
