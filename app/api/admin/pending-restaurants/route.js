import { NextResponse } from 'next/server';
import { requireApprover } from '../../../../lib/verify-approver';
import { adminDb } from '../../../../lib/firebase-admin';

/**
 * GET: List restaurants with status === 'pending'.
 * Requires approver role (APPROVER_EMAILS env).
 */
export async function GET(request) {
  const approver = await requireApprover(request);
  if (!approver) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!adminDb) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 503 });
  }
  try {
    const snapshot = await adminDb.collection('restaurants').where('status', '==', 'pending').get();
    const list = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        email: data.email,
        address: data.address,
        cuisine: data.cuisine,
        description: data.description,
        phone: data.phone,
        ownerId: data.ownerId,
        updatedAt: data.updatedAt?.toMillis?.() ?? null,
      };
    });
    list.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
    return NextResponse.json({ restaurants: list });
  } catch (err) {
    console.error('Error listing pending restaurants:', err);
    return NextResponse.json({ error: err.message || 'Failed to list' }, { status: 500 });
  }
}
