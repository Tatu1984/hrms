import LoginAuditClient from '@/components/admin/LoginAuditClient';

export const dynamic = 'force-dynamic';

export default function LoginAuditPage() {
  // The (admin) layout already restricts this section to ADMIN, so admins here
  // can revoke sessions.
  return <LoginAuditClient canRevoke />;
}
