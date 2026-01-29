/**
 * Integration Service
 * Business logic for external integrations (Azure DevOps, Asana, Confluence)
 */

import { integrationsApi } from '@/lib/api';
import type { ApiResponse } from '@/lib/api';

type IntegrationType = 'AZURE_DEVOPS' | 'ASANA' | 'CONFLUENCE';

interface IntegrationConnection {
  id: string;
  platform: IntegrationType;
  name: string;
  authType: string;
  organizationUrl?: string;
  organizationName?: string;
  workspaceId?: string;
  syncEnabled: boolean;
  syncFrequency: string;
  lastSyncAt?: string;
  lastSyncStatus?: string;
  lastSyncError?: string;
  isActive: boolean;
}

interface UserMapping {
  id: string;
  connectionId: string;
  employeeId: string;
  employeeEmail: string;
  externalUserId: string;
  externalEmail: string;
  externalName: string;
}

interface WorkItem {
  id: string;
  connectionId: string;
  externalId: string;
  externalUrl: string;
  platform: IntegrationType;
  title: string;
  description?: string;
  workItemType: string;
  status: string;
  priority?: string;
  assignedToId?: string;
  assignedToName?: string;
  createdDate: string;
  dueDate?: string;
  projectName?: string;
}

class IntegrationService {
  // =====================
  // Connection Management
  // =====================

  /**
   * Get all integration connections
   */
  async getConnections(): Promise<ApiResponse<IntegrationConnection[]>> {
    return integrationsApi.getConnections() as Promise<ApiResponse<IntegrationConnection[]>>;
  }

  /**
   * Get connections by platform
   */
  async getConnectionsByPlatform(platform: IntegrationType): Promise<ApiResponse<IntegrationConnection[]>> {
    const result = await this.getConnections();

    if (!result.success || !result.data) {
      return result;
    }

    const filtered = result.data.filter((conn) => conn.platform === platform);
    return { success: true, data: filtered };
  }

  /**
   * Create new integration connection
   */
  async createConnection(data: {
    platform: IntegrationType;
    name: string;
    accessToken: string;
    organizationUrl?: string;
    workspaceId?: string;
  }): Promise<ApiResponse<IntegrationConnection>> {
    return integrationsApi.createConnection(data) as Promise<ApiResponse<IntegrationConnection>>;
  }

  /**
   * Test connection
   */
  async testConnection(data: {
    platform: IntegrationType;
    accessToken: string;
    organizationUrl?: string;
  }): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return integrationsApi.testConnection(data) as Promise<ApiResponse<{ success: boolean; message: string }>>;
  }

  // =====================
  // User Mappings
  // =====================

  /**
   * Get user mappings for a connection
   */
  async getUserMappings(connectionId?: string): Promise<ApiResponse<UserMapping[]>> {
    return integrationsApi.getUserMappings({ connectionId }) as Promise<ApiResponse<UserMapping[]>>;
  }

  /**
   * Create user mapping
   */
  async createUserMapping(data: {
    connectionId: string;
    employeeId: string;
    employeeEmail: string;
    externalUserId: string;
    externalEmail: string;
    externalName: string;
  }): Promise<ApiResponse<UserMapping>> {
    return integrationsApi.createUserMapping(data) as Promise<ApiResponse<UserMapping>>;
  }

  // =====================
  // Work Items
  // =====================

  /**
   * Get work items
   */
  async getWorkItems(params?: {
    connectionId?: string;
    assignedTo?: string;
  }): Promise<ApiResponse<WorkItem[]>> {
    return integrationsApi.getWorkItems(params) as Promise<ApiResponse<WorkItem[]>>;
  }

  /**
   * Get work items for employee
   */
  async getEmployeeWorkItems(employeeId: string): Promise<ApiResponse<WorkItem[]>> {
    return this.getWorkItems({ assignedTo: employeeId });
  }

  // =====================
  // Sync Operations
  // =====================

  /**
   * Trigger sync for a connection
   */
  async syncConnection(connectionId: string): Promise<ApiResponse<void>> {
    return integrationsApi.sync(connectionId) as Promise<ApiResponse<void>>;
  }

  /**
   * Sync all active connections
   */
  async syncAllConnections(): Promise<ApiResponse<{ synced: number; failed: number }>> {
    const result = await this.getConnections();

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Failed to fetch connections',
      };
    }

    const activeConnections = result.data.filter(
      (conn) => conn.isActive && conn.syncEnabled
    );

    let synced = 0;
    let failed = 0;

    for (const conn of activeConnections) {
      const syncResult = await this.syncConnection(conn.id);
      if (syncResult.success) {
        synced++;
      } else {
        failed++;
      }
    }

    return { success: true, data: { synced, failed } };
  }

  // =====================
  // Azure DevOps Specific
  // =====================

  /**
   * Get Azure DevOps project details
   */
  async getAzureDevOpsProject(
    organizationUrl: string,
    project: string
  ): Promise<ApiResponse<unknown>> {
    return integrationsApi.getAzureDevOpsProject({ organizationUrl, project }) as Promise<ApiResponse<unknown>>;
  }

  // =====================
  // Utility Methods
  // =====================

  /**
   * Get integration platform display name
   */
  getPlatformDisplayName(platform: IntegrationType): string {
    switch (platform) {
      case 'AZURE_DEVOPS':
        return 'Azure DevOps';
      case 'ASANA':
        return 'Asana';
      case 'CONFLUENCE':
        return 'Confluence';
      default:
        return platform;
    }
  }

  /**
   * Get integration platform icon
   */
  getPlatformIcon(platform: IntegrationType): string {
    switch (platform) {
      case 'AZURE_DEVOPS':
        return '🔷';
      case 'ASANA':
        return '🎯';
      case 'CONFLUENCE':
        return '📝';
      default:
        return '🔗';
    }
  }

  /**
   * Get sync status display info
   */
  getSyncStatusDisplay(connection: IntegrationConnection): {
    status: 'success' | 'error' | 'pending' | 'never';
    label: string;
    color: string;
  } {
    if (!connection.lastSyncAt) {
      return { status: 'never', label: 'Never synced', color: 'gray' };
    }

    if (connection.lastSyncError) {
      return { status: 'error', label: 'Sync failed', color: 'red' };
    }

    if (connection.lastSyncStatus === 'SUCCESS') {
      return { status: 'success', label: 'Synced', color: 'green' };
    }

    return { status: 'pending', label: 'Syncing...', color: 'yellow' };
  }
}

// Export singleton instance
export const integrationService = new IntegrationService();

// Export class for testing
export { IntegrationService };
