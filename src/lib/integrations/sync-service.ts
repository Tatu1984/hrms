/**
 * Integration Sync Service
 * Handles syncing work items from Azure DevOps and Asana to HRMS
 */

import { prisma } from '@/lib/db';
import { createAzureDevOpsClient, type AzureDevOpsWorkItem, type AzureDevOpsCommit } from './azure-devops-client';
import { createAsanaClient, type AsanaTask } from './asana-client';
import type { IntegrationType } from '@prisma/client';

export interface SyncOptions {
  syncWorkItems?: boolean;
  syncCommits?: boolean;
  syncPullRequests?: boolean;
  startDate?: Date;
  projectIds?: string[];
}

export interface SyncResult {
  success: boolean;
  workItemsSynced: number;
  commitsSynced: number;
  errors: string[];
  startTime: Date;
  endTime: Date;
  duration: number; // milliseconds
}

export class IntegrationSyncService {
  /**
   * Sync data from a specific integration connection
   */
  static async syncConnection(connectionId: string, options: SyncOptions = {}): Promise<SyncResult> {
    const startTime = new Date();
    const result: SyncResult = {
      success: false,
      workItemsSynced: 0,
      commitsSynced: 0,
      errors: [],
      startTime,
      endTime: new Date(),
      duration: 0,
    };

    try {
      // Fetch connection details
      const connection = await prisma.integrationConnection.findUnique({
        where: { id: connectionId },
        include: { userMappings: true },
      });

      if (!connection) {
        result.errors.push('Connection not found');
        return result;
      }

      if (!connection.isActive || !connection.syncEnabled) {
        result.errors.push('Connection is not active or sync is disabled');
        return result;
      }

      // Route to platform-specific sync
      if (connection.platform === 'AZURE_DEVOPS') {
        await this.syncAzureDevOps(connection, options, result);
      } else if (connection.platform === 'ASANA') {
        await this.syncAsana(connection, options, result);
      } else {
        result.errors.push(`Unknown platform: ${connection.platform}`);
      }

      // Update connection last sync status
      await prisma.integrationConnection.update({
        where: { id: connectionId },
        data: {
          lastSyncAt: new Date(),
          lastSyncStatus: result.errors.length === 0 ? 'SUCCESS' : 'PARTIAL',
          lastSyncError: result.errors.length > 0 ? result.errors.join('; ') : null,
        },
      });

      result.success = result.errors.length === 0;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(errorMessage);
      console.error('Sync error:', error);

      // Update connection with error
      await prisma.integrationConnection.update({
        where: { id: connectionId },
        data: {
          lastSyncAt: new Date(),
          lastSyncStatus: 'FAILED',
          lastSyncError: errorMessage,
        },
      });
    }

    result.endTime = new Date();
    result.duration = result.endTime.getTime() - result.startTime.getTime();

    return result;
  }

  /**
   * Sync Azure DevOps work items and commits
   */
  private static async syncAzureDevOps(
    connection: any,
    options: SyncOptions,
    result: SyncResult
  ): Promise<void> {
    if (!connection.organizationUrl || !connection.accessToken) {
      result.errors.push('Missing Azure DevOps configuration');
      return;
    }

    const client = createAzureDevOpsClient(connection.organizationUrl, connection.accessToken);

    // Test connection
    const isConnected = await client.testConnection();
    if (!isConnected) {
      result.errors.push('Failed to connect to Azure DevOps');
      return;
    }

    // Sync work items
    if (options.syncWorkItems !== false) {
      try {
        const projects = await client.getProjects();

        for (const project of projects) {
          // Skip if projectIds filter is specified and this project is not in it
          if (options.projectIds && !options.projectIds.includes(project.id)) {
            continue;
          }

          const workItems = await client.getWorkItems(project.name, {
            startDate: options.startDate ? options.startDate.toISOString().split('T')[0] : undefined,
          });

          for (const workItem of workItems) {
            await this.saveAzureDevOpsWorkItem(connection.id, workItem, project.name);
            result.workItemsSynced++;
          }
        }
      } catch (error) {
        result.errors.push(`Work items sync error: ${error instanceof Error ? error.message : 'Unknown'}`);
      }
    }

    // Sync commits
    if (options.syncCommits !== false) {
      try {
        const projects = await client.getProjects();

        for (const project of projects) {
          if (options.projectIds && !options.projectIds.includes(project.id)) {
            continue;
          }

          const repositories = await client.getRepositories(project.name);

          for (const repo of repositories) {
            // Get commits from each mapped user
            for (const mapping of connection.userMappings) {
              const commits = await client.getCommits(project.name, repo.id, {
                author: mapping.externalEmail,
                fromDate: options.startDate?.toISOString(),
                top: 100,
              });

              for (const commit of commits) {
                await this.saveAzureDevOpsCommit(connection.id, commit, mapping.employeeId, repo.name);
                result.commitsSynced++;
              }
            }
          }
        }
      } catch (error) {
        result.errors.push(`Commits sync error: ${error instanceof Error ? error.message : 'Unknown'}`);
      }
    }
  }

  /**
   * Sync Asana tasks
   */
  private static async syncAsana(
    connection: any,
    options: SyncOptions,
    result: SyncResult
  ): Promise<void> {
    if (!connection.workspaceId || !connection.accessToken) {
      result.errors.push('Missing Asana configuration');
      return;
    }

    const client = createAsanaClient(connection.accessToken);

    // Test connection
    const isConnected = await client.testConnection();
    if (!isConnected) {
      result.errors.push('Failed to connect to Asana');
      return;
    }

    // Sync work items (tasks)
    if (options.syncWorkItems !== false) {
      try {
        console.log('Fetching Asana projects for workspace:', connection.workspaceId);
        const projects = await client.getProjects(connection.workspaceId, { archived: false });
        console.log(`Found ${projects.length} Asana projects`);

        for (const project of projects) {
          // Skip if projectIds filter is specified
          if (options.projectIds && !options.projectIds.includes(project.gid)) {
            continue;
          }

          console.log(`Fetching tasks for project: ${project.name}`);
          const tasks = await client.getTasks(project.gid, {
            completed_since: options.startDate?.toISOString(),
          });
          console.log(`Found ${tasks.length} tasks in ${project.name}`);

          for (const task of tasks) {
            try {
              await this.saveAsanaTask(connection.id, task, project.name, client);
              result.workItemsSynced++;
            } catch (taskError) {
              console.error('Error saving Asana task:', taskError);
              result.errors.push(`Failed to save task ${task.gid}: ${taskError instanceof Error ? taskError.message : 'Unknown'}`);
            }
          }
        }
      } catch (error) {
        console.error('Asana sync error:', error);
        result.errors.push(`Tasks sync error: ${error instanceof Error ? error.message : 'Unknown'}`);
      }
    }
  }

  /**
   * Save Azure DevOps work item to database
   */
  private static async saveAzureDevOpsWorkItem(
    connectionId: string,
    workItem: AzureDevOpsWorkItem,
    projectName: string
  ): Promise<void> {
    const assignee = workItem.fields['System.AssignedTo'];

    // Try to map assignee to HRMS employee
    let assignedToId: string | null = null;
    if (assignee) {
      const mapping = await prisma.integrationUserMapping.findFirst({
        where: {
          connectionId,
          externalEmail: assignee.uniqueName,
        },
      });
      assignedToId = mapping?.employeeId || null;
    }

    await prisma.workItem.upsert({
      where: {
        connectionId_externalId: {
          connectionId,
          externalId: workItem.id.toString(),
        },
      },
      create: {
        connectionId,
        externalId: workItem.id.toString(),
        externalUrl: workItem._links.html.href,
        platform: 'AZURE_DEVOPS',
        title: workItem.fields['System.Title'],
        description: workItem.fields['System.Description'],
        workItemType: workItem.fields['System.WorkItemType'],
        status: workItem.fields['System.State'],
        priority: workItem.fields['Microsoft.VSTS.Common.Priority']?.toString(),
        assignedToId,
        assignedTo: assignee?.id,
        assignedToName: assignee?.displayName,
        createdDate: new Date(workItem.fields['System.CreatedDate']),
        modifiedDate: new Date(workItem.fields['System.ChangedDate']),
        projectName,
        areaPath: workItem.fields['System.AreaPath'],
        iterationPath: workItem.fields['System.IterationPath'],
        storyPoints: workItem.fields['Microsoft.VSTS.Scheduling.StoryPoints'],
        metadata: workItem.fields as any,
        lastSyncedAt: new Date(),
      },
      update: {
        title: workItem.fields['System.Title'],
        description: workItem.fields['System.Description'],
        status: workItem.fields['System.State'],
        priority: workItem.fields['Microsoft.VSTS.Common.Priority']?.toString(),
        assignedToId,
        assignedTo: assignee?.id,
        assignedToName: assignee?.displayName,
        modifiedDate: new Date(workItem.fields['System.ChangedDate']),
        areaPath: workItem.fields['System.AreaPath'],
        iterationPath: workItem.fields['System.IterationPath'],
        storyPoints: workItem.fields['Microsoft.VSTS.Scheduling.StoryPoints'],
        metadata: workItem.fields as any,
        lastSyncedAt: new Date(),
      },
    });
  }

  /**
   * Save Azure DevOps commit to database
   */
  private static async saveAzureDevOpsCommit(
    connectionId: string,
    commit: AzureDevOpsCommit,
    employeeId: string,
    repositoryName: string
  ): Promise<void> {
    // Extract work item IDs from commit message
    const workItemIdRegex = /#(\d+)/g;
    const linkedWorkItemIds: string[] = [];
    let match;
    while ((match = workItemIdRegex.exec(commit.comment)) !== null) {
      linkedWorkItemIds.push(match[1]);
    }

    await prisma.developerCommit.upsert({
      where: {
        connectionId_commitHash: {
          connectionId,
          commitHash: commit.commitId,
        },
      },
      create: {
        connectionId,
        employeeId,
        commitHash: commit.commitId,
        commitMessage: commit.comment,
        commitUrl: commit.remoteUrl,
        repositoryName,
        filesChanged: commit.changeCounts.Add + commit.changeCounts.Edit + commit.changeCounts.Delete,
        linesAdded: commit.changeCounts.Add,
        linesDeleted: commit.changeCounts.Delete,
        commitDate: new Date(commit.author.date),
        authorDate: new Date(commit.author.date),
        authorName: commit.author.name,
        authorEmail: commit.author.email,
        linkedWorkItems: linkedWorkItemIds,
        lastSyncedAt: new Date(),
      },
      update: {
        commitMessage: commit.comment,
        filesChanged: commit.changeCounts.Add + commit.changeCounts.Edit + commit.changeCounts.Delete,
        linkedWorkItems: linkedWorkItemIds,
        lastSyncedAt: new Date(),
      },
    });
  }

  /**
   * Save Asana task to database
   */
  private static async saveAsanaTask(
    connectionId: string,
    task: AsanaTask,
    projectName: string,
    client: any
  ): Promise<void> {
    // Try to map assignee to HRMS employee
    let assignedToId: string | null = null;
    if (task.assignee) {
      const mapping = await prisma.integrationUserMapping.findFirst({
        where: {
          connectionId,
          externalEmail: task.assignee.email,
        },
      });
      assignedToId = mapping?.employeeId || null;
    }

    // Get section and status
    const section = task.memberships?.[0]?.section;
    const status = client.getTaskStatus(task);
    const priority = client.getTaskPriority(task);

    await prisma.workItem.upsert({
      where: {
        connectionId_externalId: {
          connectionId,
          externalId: task.gid,
        },
      },
      create: {
        connectionId,
        externalId: task.gid,
        externalUrl: task.permalink_url,
        platform: 'ASANA',
        title: task.name,
        description: task.notes,
        workItemType: 'Task',
        status,
        priority,
        assignedToId,
        assignedTo: task.assignee?.gid,
        assignedToName: task.assignee?.name,
        createdDate: new Date(task.created_at),
        modifiedDate: new Date(task.modified_at),
        completedDate: task.completed_at ? new Date(task.completed_at) : null,
        dueDate: task.due_on ? new Date(task.due_on) : null,
        projectName,
        sectionId: section?.gid,
        sectionName: section?.name,
        tags: task.tags as any,
        metadata: task as any,
        lastSyncedAt: new Date(),
      },
      update: {
        title: task.name,
        description: task.notes,
        status,
        priority,
        assignedToId,
        assignedTo: task.assignee?.gid,
        assignedToName: task.assignee?.name,
        modifiedDate: new Date(task.modified_at),
        completedDate: task.completed_at ? new Date(task.completed_at) : null,
        dueDate: task.due_on ? new Date(task.due_on) : null,
        sectionId: section?.gid,
        sectionName: section?.name,
        tags: task.tags as any,
        metadata: task as any,
        lastSyncedAt: new Date(),
      },
    });
  }
}
