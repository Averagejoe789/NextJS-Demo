import { NextResponse } from 'next/server';
import { getAuthUser, getApproverEmails } from '../../../../lib/verify-approver';

/**
 * GET: Returns whether the authenticated user is an approver.
 * Client sends Authorization: Bearer <Firebase ID token>.
 */
export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user || !user.email) {
    return NextResponse.json({ approver: false }, { status: 200 });
  }
  const emails = getApproverEmails();
  const approver = emails.length > 0 && emails.includes(user.email);
  return NextResponse.json({ approver });
}
