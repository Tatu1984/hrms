import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// Import from the edge-safe JWT module (jose only). Importing from './lib/auth'
// would pull session-store -> node:crypto into the Edge bundle and fail deploy.
import { decrypt } from './lib/jwt';

const publicPaths = ['/login', '/signup'];
const adminPaths = ['/admin'];
const managerPaths = ['/manager'];
const employeePaths = ['/employee'];

// Map URL paths to permission keys
const pathToPermissionMap: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/employees': 'employees',
  '/attendance': 'attendance',
  '/leaves': 'leaves',
  '/leave-management': 'leaves',
  '/projects': 'projects',
  '/tasks': 'tasks',
  '/payroll': 'payroll',
  '/payroll-settings': 'payroll_settings',
  '/accounts': 'accounts',
  '/invoices': 'invoices',
  '/reports': 'reports',
  '/leads': 'leads',
  '/sales': 'sales',
  '/messages': 'messages',
  '/settings': 'settings',
  '/security': 'iam',
  '/iam': 'iam',
  '/integrations': 'integrations',
  '/ai': 'ai',
  '/hr-documents': 'hr_documents',
};

function checkSectionPermission(pathname: string, permissions: any): boolean {
  // Always allow the dashboard — it's the base/fallback page (prevents redirect
  // loops for users who lack other section permissions).
  if (pathname.endsWith('/dashboard')) {
    return true;
  }

  // Default-deny: a non-admin with no permissions object gets nothing beyond the
  // dashboard. (Previously this returned true, granting full access — a
  // privilege-escalation hole.)
  if (!permissions) {
    return false;
  }

  // Find the section from the pathname
  for (const [path, permissionKey] of Object.entries(pathToPermissionMap)) {
    // Skip dashboard in permission check (handled above)
    if (path === '/dashboard') continue;

    if (pathname.includes(path)) {
      return permissions[permissionKey] === true;
    }
  }

  // Unmatched paths (e.g. profile, payslips) have no dedicated permission key;
  // the role-prefix checks already scope them to the user's own area.
  return true;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const token = request.cookies.get('session')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const session = await decrypt(token);
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check role-based access
  if (adminPaths.some(path => pathname.startsWith(path)) && session.role !== 'ADMIN') {
    return NextResponse.redirect(new URL(`/${session.role.toLowerCase()}/dashboard`, request.url));
  }

  if (managerPaths.some(path => pathname.startsWith(path)) && session.role !== 'MANAGER') {
    return NextResponse.redirect(new URL(`/${session.role.toLowerCase()}/dashboard`, request.url));
  }

  if (employeePaths.some(path => pathname.startsWith(path)) && session.role !== 'EMPLOYEE') {
    return NextResponse.redirect(new URL(`/${session.role.toLowerCase()}/dashboard`, request.url));
  }

  // Check section-level permissions for all non-admins (admins have full access).
  // Runs even when permissions is null so a user without a permissions object is
  // confined to their dashboard rather than granted everything.
  if (session.role !== 'ADMIN') {
    const hasPermission = checkSectionPermission(pathname, session.permissions);
    if (!hasPermission) {
      // Redirect to dashboard if no permission
      return NextResponse.redirect(new URL(`/${session.role.toLowerCase()}/dashboard`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};