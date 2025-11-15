import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET /api/integrations/user-mappings - Get user mappings and unmapped users
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('connectionId');

    if (!connectionId) {
      return NextResponse.json({ error: 'Connection ID required' }, { status: 400 });
    }

    // Get existing mappings
    const existingMappings = await prisma.integrationUserMapping.findMany({
      where: { connectionId },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            designation: true,
          },
        },
      },
    });

    // Get all unique users from work items for this connection
    const workItems = await prisma.workItem.findMany({
      where: { connectionId },
      select: {
        assignedTo: true,
        assignedToName: true,
        metadata: true,
      },
      distinct: ['assignedTo'],
    });

    // Extract unique users
    const usersMap = new Map();

    workItems.forEach((item) => {
      if (item.assignedTo && item.assignedToName) {
        const metadata = item.metadata as any;
        const email = metadata?.['System.AssignedTo']?.uniqueName ||
                     metadata?.assignee?.email ||
                     '';

        if (!usersMap.has(item.assignedTo)) {
          usersMap.set(item.assignedTo, {
            externalId: item.assignedTo,
            externalUsername: item.assignedToName,
            externalEmail: email,
          });
        }
      }
    });

    // Merge with existing mappings
    const allUsers = Array.from(usersMap.values()).map((user) => {
      const existing = existingMappings.find((m) => m.externalId === user.externalId);
      return {
        id: existing?.id,
        externalId: user.externalId,
        externalUsername: user.externalUsername,
        externalEmail: user.externalEmail,
        employeeId: existing?.employeeId,
        employee: existing?.employee,
      };
    });

    console.log(`Returning ${allUsers.length} users for connectionId ${connectionId}`);
    return NextResponse.json(allUsers);
  } catch (error) {
    console.error('Error fetching user mappings:', error);
    return NextResponse.json({ error: 'Failed to fetch user mappings' }, { status: 500 });
  }
}

// POST /api/integrations/user-mappings - Save user mappings
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { connectionId, mappings } = body;

    if (!connectionId || !Array.isArray(mappings)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Delete existing mappings for this connection
    await prisma.integrationUserMapping.deleteMany({
      where: { connectionId },
    });

    // Create new mappings
    const createPromises = mappings.map((mapping: any) =>
      prisma.integrationUserMapping.create({
        data: {
          connectionId,
          externalId: mapping.externalId,
          externalUsername: mapping.externalUsername,
          externalEmail: mapping.externalEmail,
          employeeId: mapping.employeeId,
        },
      })
    );

    await Promise.all(createPromises);

    // Update work items with the new employee mappings
    for (const mapping of mappings) {
      await prisma.workItem.updateMany({
        where: {
          connectionId,
          assignedTo: mapping.externalId,
        },
        data: {
          assignedToId: mapping.employeeId,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving user mappings:', error);
    return NextResponse.json({ error: 'Failed to save user mappings' }, { status: 500 });
  }
}
