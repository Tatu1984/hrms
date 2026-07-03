import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { consumeResetToken } from '@/lib/password-reset';

/**
 * Complete a password reset. Consumes a single-use token from the reset link,
 * sets the new password, and clears the must-change-password flag.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = String(body.token || '');
    const password = String(body.password || '');

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 },
      );
    }

    const consumed = await consumeResetToken(token);
    if (!consumed) {
      return NextResponse.json(
        { error: 'This reset link is invalid or expired' },
        { status: 400 },
      );
    }

    const hashed = await hashPassword(password);
    await prisma.user.update({
      where: { id: consumed.userId },
      data: { password: hashed, mustChangePassword: false },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Reset-password error:', error);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
