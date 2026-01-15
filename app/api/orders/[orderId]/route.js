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
      console.error('adminDb is not initialized - Firebase Admin credentials not configured');
      return NextResponse.json(
        {
          error: 'Firebase Admin not initialized',
          details: 'Firebase Admin credentials are not configured. Please configure one of the following:\n' +
            '1. Set FIREBASE_SERVICE_ACCOUNT environment variable with your service account JSON\n' +
            '2. Set GOOGLE_APPLICATION_CREDENTIALS environment variable pointing to your service account key file\n' +
            '3. Place service-account-key.json file in the project root\n' +
            '4. Configure Google Cloud SDK with application default credentials\n' +
            'See FIREBASE_SETUP.md for detailed instructions.',
          code: 'FIREBASE_ADMIN_NOT_INITIALIZED'
        },
        { status: 500 }
      );
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

    console.log('Fetching order:', { orderId, restaurantId });

    if (!restaurantId || !orderId) {
      return NextResponse.json(
        { error: 'restaurantId and orderId are required' },
        { status: 400 }
      );
    }

    // Ensure adminDb is initialized
    if (!adminDb) {
      console.error('adminDb is not initialized - Firebase Admin credentials not configured');
      return NextResponse.json(
        {
          error: 'Firebase Admin not initialized',
          details: 'Firebase Admin credentials are not configured. Please configure one of the following:\n' +
            '1. Set FIREBASE_SERVICE_ACCOUNT environment variable with your service account JSON\n' +
            '2. Set GOOGLE_APPLICATION_CREDENTIALS environment variable pointing to your service account key file\n' +
            '3. Place service-account-key.json file in the project root\n' +
            '4. Configure Google Cloud SDK with application default credentials\n' +
            'See FIREBASE_SETUP.md for detailed instructions.',
          code: 'FIREBASE_ADMIN_NOT_INITIALIZED'
        },
        { status: 500 }
      );
    }

    console.log('Querying Firestore for order:', orderId);
    const orderRef = adminDb
      .collection('restaurants')
      .doc(restaurantId)
      .collection('orders')
      .doc(orderId);

    let orderSnap;
    try {
      orderSnap = await orderRef.get();
      console.log('Order snapshot retrieved:', orderSnap.exists);
    } catch (firestoreError) {
      console.error('Firestore query error:', firestoreError);
      
      // Check if this is a credentials error
      if (firestoreError.message && firestoreError.message.includes('Could not load the default credentials')) {
        return NextResponse.json(
          {
            error: 'Firebase Admin credentials not configured',
            details: 'Firebase Admin credentials are invalid or not configured. The application tried to use default credentials but they are not available.\n\n' +
              'Please configure one of the following:\n' +
              '1. Set FIREBASE_SERVICE_ACCOUNT environment variable with your service account JSON\n' +
              '2. Set GOOGLE_APPLICATION_CREDENTIALS environment variable pointing to your service account key file\n' +
              '3. Place service-account-key.json file in the project root\n' +
              '4. Configure Google Cloud SDK with application default credentials\n\n' +
              'See FIREBASE_SETUP.md for detailed instructions.',
            code: 'FIREBASE_CREDENTIALS_INVALID'
          },
          { status: 500 }
        );
      }
      
      // Generic Firestore error
      throw new Error(`Firestore error: ${firestoreError.message}`);
    }

    if (!orderSnap.exists) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const orderData = orderSnap.data();
    
    if (!orderData) {
      return NextResponse.json(
        { error: 'Order data is empty' },
        { status: 404 }
      );
    }
    
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

    // Safely serialize items array
    let items = [];
    try {
      if (Array.isArray(orderData.items)) {
        items = orderData.items.map(item => ({
          menuItemId: item.menuItemId || null,
          name: item.name || '',
          price: typeof item.price === 'number' ? item.price : 0,
          quantity: typeof item.quantity === 'number' ? item.quantity : 0,
          specialInstructions: item.specialInstructions || null,
          imageUrl: item.imageUrl || null
        }));
      }
    } catch (err) {
      console.error('Error serializing items:', err);
      items = [];
    }

    // Build order object manually to avoid serialization issues with Firestore objects
    const order = {
      id: orderSnap.id,
      restaurantId: orderData.restaurantId || null,
      tableId: orderData.tableId || null,
      tableNumber: typeof orderData.tableNumber === 'number' ? orderData.tableNumber : null,
      chatId: orderData.chatId || null,
      items: items,
      totalAmount: typeof orderData.totalAmount === 'number' ? orderData.totalAmount : 0,
      status: orderData.status || 'pending',
      specialInstructions: orderData.specialInstructions || null,
      notes: orderData.notes || null,
      createdAt,
      updatedAt
    };

    // Test serialization before returning
    try {
      JSON.stringify(order);
    } catch (serializationError) {
      console.error('Serialization error:', serializationError);
      throw new Error(`Failed to serialize order: ${serializationError.message}`);
    }

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
    // Return detailed error in production for debugging
    return NextResponse.json(
      { 
        error: 'Failed to fetch order', 
        details: error.message,
        code: error.code || 'UNKNOWN_ERROR',
        name: error.name || 'Error',
        // Include stack in development
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      },
      { status: 500 }
    );
  }
}

