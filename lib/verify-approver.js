/**
 * Server-side: verify Firebase ID token and check if user is an approver.
 * Approvers are defined in APPROVER_EMAILS env (comma-separated).
 * Use in API routes that require approver role.
 */
import { adminAuth } from './firebase-admin';

const APPROVER_EMAILS = (process.env.APPROVER_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function getApproverEmails() {
  return [...APPROVER_EMAILS];
}

/**
 * Verify Authorization: Bearer <token> and return decoded token if valid.
 * @param {Request} request - Next.js request
 * @returns {{ uid, email } | null}
 */
export async function getAuthUser(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  if (!token) return null;
  try {
    if (!adminAuth) return null;
    const decoded = await adminAuth.verifyIdToken(token);
    return { uid: decoded.uid, email: (decoded.email || '').toLowerCase() };
  } catch (err) {
    return null;
  }
}

/**
 * Verify request has valid Firebase token and user is in APPROVER_EMAILS.
 * @param {Request} request - Next.js request
 * @returns {{ uid, email } | null} - user if approver, null otherwise
 */
export async function requireApprover(request) {
  const user = await getAuthUser(request);
  if (!user || !user.email) return null;
  if (!APPROVER_EMAILS.length) return null;
  if (!APPROVER_EMAILS.includes(user.email)) return null;
  return user;
}
