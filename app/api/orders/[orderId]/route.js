import { NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebase-admin';
import admin from 'firebase-admin';
import { canUpdateOrder } from '../../../../lib/order-utils';

export async function PATCH(request, { params }) {
  try {
    // Ensure params is awaited (Next.js 14+ compatibility)
    const resolvedParams = await params;
    const { orderId } = resolvedParams;
    const body = await request.json();
    
    // Ensure adminDb is initialized
    if (!adminDb) {
      throw new Error('Firebase Admin not initialized');
    }
    const { restaurantId, status, notes } = body;

    if (!restaurantId || !orderId) {
      return NextResponse.json(
        { error: 'restaurantId and orderId are required' },
        { status: 400 }
      );
    }

    // Fetch current order
    const orderRef = adminDb
      .collection('restaurants')
      .doc(restaurantId)
      .collection('orders')
      .doc(orderId);

    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const currentOrder = orderSnap.data();

    // Validate status update
    if (status) {
      if (!canUpdateOrder(currentOrder.status)) {
        return NextResponse.json(
          { error: `Cannot update order with status: ${currentOrder.status}` },
          { status: 400 }
        );
      }

      const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status: ${status}` },
          { status: 400 }
        );
      }
    }

    // Update order
    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (status) {
      updateData.status = status;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    await orderRef.update(updateData);

    // Add status update message to chat if chatId exists
    if (currentOrder.chatId && status) {
      try {
        await adminDb
          .collection('restaurants')
          .doc(restaurantId)
          .collection('chatSessions')
          .doc(currentOrder.chatId)
          .collection('messages')
          .add({
            text: `Order #${orderId} status updated: ${status}`,
            sender: 'assistant',
            type: 'order_status',
            metadata: {
              orderId,
              status,
              previousStatus: currentOrder.status
            },
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });
      } catch (err) {
        console.error('Error adding status update message to chat:', err);
        // Don't fail the update if chat message fails
      }
    }

    return NextResponse.json({
      success: true,
      orderId,
      status: status || currentOrder.status,
      message: 'Order updated successfully'
    });

  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request, { params }) {
  try {
    // Ensure params is awaited (Next.js 14+ compatibility)
    const resolvedParams = await params;
    const { orderId } = resolvedParams;
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId || !orderId) {
      return NextResponse.json(
        { error: 'restaurantId and orderId are required' },
        { status: 400 }
      );
    }

    // Ensure adminDb is initialized
    if (!adminDb) {
      throw new Error('Firebase Admin not initialized');
    }

    const orderRef = adminDb
      .collection('restaurants')
      .doc(restaurantId)
      .collection('orders')
      .doc(orderId);

    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const orderData = orderSnap.data();
    
    // Safely convert Firestore timestamps to ISO strings
    let createdAt = null;
    let updatedAt = null;
    
    try {
      if (orderData.createdAt) {
        const createdAtDate = orderData.createdAt.toDate ? orderData.createdAt.toDate() : orderData.createdAt;
        createdAt = createdAtDate instanceof Date ? createdAtDate.toISOString() : null;
      }
    } catch (err) {
      console.error('Error converting createdAt:', err);
    }
    
    try {
      if (orderData.updatedAt) {
        const updatedAtDate = orderData.updatedAt.toDate ? orderData.updatedAt.toDate() : orderData.updatedAt;
        updatedAt = updatedAtDate instanceof Date ? updatedAtDate.toISOString() : null;
      }
    } catch (err) {
      console.error('Error converting updatedAt:', err);
    }

    const order = {
      id: orderSnap.id,
      ...orderData,
      createdAt,
      updatedAt
    };

    return NextResponse.json({
      success: true,
      order
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
    return NextResponse.json(
      { 
        error: 'Failed to fetch order', 
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

