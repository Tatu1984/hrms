import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { assertPublicHttpsUrl, INTEGRATION_ALLOWED_HOSTS } from '@/lib/url-guard';
import { createAzureDevOpsClient } from '@/lib/integrations/azure-devops-client';
import { createAsanaClient } from '@/lib/integrations/asana-client';
import { createConfluenceClient } from '@/lib/integrations/confluence-client';

// POST /api/integrations/connections/test - Test connection without saving
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { platform, accessToken, organizationUrl, workspaceId, confluenceEmail } = body;

    if (!platform || !accessToken) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let isValid = false;
    let errorMessage = '';

    try {
      if (platform === 'AZURE_DEVOPS') {
        if (!organizationUrl) {
          return NextResponse.json(
            { error: 'Organization URL is required for Azure DevOps' },
            { status: 400 }
          );
        }
        try {
          assertPublicHttpsUrl(organizationUrl, INTEGRATION_ALLOWED_HOSTS.AZURE_DEVOPS);
        } catch (e) {
          return NextResponse.json(
            { error: e instanceof Error ? e.message : 'Invalid organization URL' },
            { status: 400 }
          );
        }
        const client = createAzureDevOpsClient(organizationUrl, accessToken);
        isValid = await client.testConnection();
        if (!isValid) {
          errorMessage = 'Invalid credentials or organization URL';
        }
      } else if (platform === 'ASANA') {
        const client = createAsanaClient(accessToken);
        isValid = await client.testConnection();
        if (!isValid) {
          errorMessage = 'Invalid access token';
        }
      } else if (platform === 'CONFLUENCE') {
        if (!organizationUrl) {
          return NextResponse.json(
            { error: 'Organization URL is required for Confluence' },
            { status: 400 }
          );
        }
        if (!confluenceEmail) {
          return NextResponse.json(
            { error: 'Email is required for Confluence' },
            { status: 400 }
          );
        }
        try {
          assertPublicHttpsUrl(organizationUrl, INTEGRATION_ALLOWED_HOSTS.CONFLUENCE);
        } catch (e) {
          return NextResponse.json(
            { error: e instanceof Error ? e.message : 'Invalid organization URL' },
            { status: 400 }
          );
        }
        const client = createConfluenceClient(organizationUrl, confluenceEmail, accessToken);
        isValid = await client.testConnection();
        if (!isValid) {
          errorMessage = 'Invalid credentials or organization URL';
        }
      } else {
        return NextResponse.json(
          { error: 'Invalid platform' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Connection test error:', error);
      errorMessage = error instanceof Error ? error.message : 'Connection test failed';
    }

    if (isValid) {
      return NextResponse.json({
        success: true,
        message: 'Connection successful',
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: errorMessage || 'Connection test failed',
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error testing connection:', error);
    return NextResponse.json(
      { error: 'Failed to test connection' },
      { status: 500 }
    );
  }
}
