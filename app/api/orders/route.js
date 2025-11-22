import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase-client';
import { collection, doc, addDoc, getDoc, getDocs, serverTimestamp, query, where, orderBy, limit } from 'firebase/firestore';
import { calculateOrderTotal, validateOrderItems } from '../../../lib/order-utils';

export async function POST(request) {
  try {
    const body = await request.json();
    const { restaurantId, tableId, chatId, items, specialInstructions } = body;

    // Validate required fields
    if (!restaurantId || !tableId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'restaurantId, tableId, and items array are required' },
        { status: 400 }
      );
    }

    // Fetch menu items for validation
    const menuRef = collection(db, `restaurants/${restaurantId}/menu`);
    const menuSnapshot = await getDocs(menuRef);

    const menuItems = menuSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Validate order items
    const validation = validateOrderItems(items, menuItems);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Order validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    // Get table info
    let tableNumber = 0;
    try {
      const tableRef = doc(db, `restaurants/${restaurantId}/tables`, tableId);
      const tableSnap = await getDoc(tableRef);
      if (tableSnap.exists()) {
        tableNumber = tableSnap.data().tableNumber || 0;
      }
    } catch (err) {
      console.error('Error fetching table info:', err);
    }

    // Calculate total
    const totalAmount = calculateOrderTotal(items);

    // Create order document
    const orderData = {
      restaurantId,
      tableId,
      tableNumber,
      chatId: chatId || null,
      items: items.map(item => ({
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions || ''
      })),
      status: 'pending',
      totalAmount,
      specialInstructions: specialInstructions || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const ordersRef = collection(db, `restaurants/${restaurantId}/orders`);
    const orderRef = await addDoc(ordersRef, orderData);

    // Add order message to chat if chatId exists
    if (chatId) {
      try {
        const messagesRef = collection(db, `restaurants/${restaurantId}/chatSessions/${chatId}/messages`);
        await addDoc(messagesRef, {
          text: `Order #${orderRef.id} placed successfully! Total: $${totalAmount.toFixed(2)}. Status: Pending.`,
          sender: 'assistant',
          type: 'order',
          metadata: {
            orderId: orderRef.id,
            status: 'pending',
            totalAmount
          },
          timestamp: serverTimestamp()
        });
      } catch (err) {
        console.error('Error adding order message to chat:', err);
        // Don't fail the order if chat message fails
      }
    }

    return NextResponse.json({
      success: true,
      orderId: orderRef.id,
      status: 'pending',
      totalAmount,
      items: items.length
    });

  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const status = searchParams.get('status');
    const tableId = searchParams.get('tableId');

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'restaurantId is required' },
        { status: 400 }
      );
    }

    const ordersRef = collection(db, `restaurants/${restaurantId}/orders`);
    
    // Build query with filters
    let q = query(ordersRef);
    
    if (status) {
      q = query(q, where('status', '==', status));
    }
    if (tableId) {
      q = query(q, where('tableId', '==', tableId));
    }
    
    // Order by creation time (newest first) and limit
    q = query(q, orderBy('createdAt', 'desc'), limit(100));
    
    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()?.toISOString() || null,
      updatedAt: doc.data().updatedAt?.toDate()?.toISOString() || null
    }));

    return NextResponse.json({
      success: true,
      orders,
      count: orders.length
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders', details: error.message },
      { status: 500 }
    );
  }
}

