import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { requireApprover } from '../../../../lib/verify-approver';
import { adminDb } from '../../../../lib/firebase-admin';

/**
 * POST: Approve or reject a restaurant.
 * Body: { restaurantId: string, action: 'approve' | 'reject', rejectionReason?: string }
 * Requires approver role (APPROVER_EMAILS env).
 */
export async function POST(request) {
  const approver = await requireApprover(request);
  if (!approver) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!adminDb) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 503 });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const { restaurantId, action, rejectionReason } = body;
  if (!restaurantId || !action || !['approve', 'reject'].includes(action)) {
    return NextResponse.json(
      { error: 'restaurantId and action (approve|reject) are required' },
      { status: 400 }
    );
  }
  if (action === 'reject' && typeof rejectionReason !== 'string') {
    return NextResponse.json({ error: 'rejectionReason is required when rejecting' }, { status: 400 });
  }
  try {
    const ref = adminDb.collection('restaurants').doc(restaurantId);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }
    const current = snap.data();
    if (current.status !== 'pending') {
      return NextResponse.json({ error: 'Restaurant is not pending' }, { status: 400 });
    }
    const ts = admin.firestore.FieldValue.serverTimestamp();
    if (action === 'approve') {
      await ref.update({
        status: 'approved',
        approvedAt: ts,
        approvedBy: approver.email,
        updatedAt: ts,
      });
      return NextResponse.json({ success: true, message: 'Restaurant approved' });
    }
    await ref.update({
      status: 'rejected',
      rejectedAt: ts,
      rejectedBy: approver.email,
      rejectionReason: rejectionReason || '',
      updatedAt: ts,
    });
    return NextResponse.json({ success: true, message: 'Restaurant rejected' });
  } catch (err) {
    console.error('Error updating restaurant:', err);
    return NextResponse.json({ error: err.message || 'Failed to update' }, { status: 500 });
  }
}
