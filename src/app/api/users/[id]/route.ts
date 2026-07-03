import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { requireRole } from '@/lib/api-auth';
import { orgWhere } from '@/lib/tenant';
type RouteContext = {
  params: Promise<{ id: string }>;
};
export async function PUT(
  req: NextRequest,
  context: RouteContext
) {
  const auth = await requireRole('ADMIN');
  if (auth instanceof NextResponse) return auth;
  const params = await context.params;
  try {
    const body = await req.json();
    const { username, password, role, permissions } = body;
    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }
    // Ensure the target user belongs to the caller's org before updating.
    const targetUser = await prisma.user.findFirst({
      where: { id: params.id, ...orgWhere(auth) },
      select: { id: true },
    });
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    // Check if username is taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        username,
        NOT: {
          id: params.id,
        },
      },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      );
    }
    const updateData: any = {
      username,
      role: role || 'EMPLOYEE',
      permissions: permissions || null,
    };
    // Only update password if provided
    if (password && password.length > 0) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters' },
          { status: 400 }
        );
      }
      updateData.password = await bcrypt.hash(password, 10);
    }
    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
    });
    return NextResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
export async function DELETE(
  req: NextRequest,
  context: RouteContext
) {
  const auth = await requireRole('ADMIN');
  if (auth instanceof NextResponse) return auth;
  const params = await context.params;
  try {
    // Prevent an admin from deleting their own account.
    if (auth.userId === params.id) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      );
    }
    // Ensure the target user belongs to the caller's org before deleting.
    const targetUser = await prisma.user.findFirst({
      where: { id: params.id, ...orgWhere(auth) },
      select: { id: true },
    });
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    await prisma.user.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}