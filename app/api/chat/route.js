import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
	admin.initializeApp({
		projectId: 'menuai-d0ab5',
	});
}

export async function POST(req) {
	const contentType = req.headers.get('content-type') || '';
	if (!contentType.includes('application/json')) {
		return new Response(
			JSON.stringify({ error: 'Content-Type must be application/json' }),
			{
				status: 400,
				headers: { 'Content-Type': 'application/json; charset=utf-8' },
			}
		);
	}

	let body;
	try {
		body = await req.json();
	} catch {
		return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json; charset=utf-8' },
		});
	}

	const messageText = body?.text || body?.message || '';
	if (!messageText || typeof messageText !== 'string' || messageText.trim() === '') {
		return new Response(
			JSON.stringify({ error: 'Message text is required' }),
			{
				status: 400,
				headers: { 'Content-Type': 'application/json; charset=utf-8' },
			}
		);
	}

	// Save message to Firestore using Admin SDK
	try {
		const db = admin.firestore();
		const messagesRef = db.collection('messages');
		
		// Save user message
		const userDocRef = await messagesRef.add({
			text: messageText.trim(),
			sender: 'user',
			timestamp: admin.firestore.FieldValue.serverTimestamp()
		});
		console.log('✅ User message saved to Firestore:', userDocRef.id);
		
		return new Response(
			JSON.stringify({ success: true, messageId: userDocRef.id }),
			{
				status: 200,
				headers: { 'Content-Type': 'application/json; charset=utf-8' },
			}
		);
	} catch (firestoreError) {
		console.error('❌ Error saving to Firestore:', firestoreError);
		console.error('Error details:', {
			code: firestoreError.code,
			message: firestoreError.message,
			stack: firestoreError.stack
		});
		
		return new Response(
			JSON.stringify({ error: 'Failed to save message', details: firestoreError.message }),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json; charset=utf-8' },
			}
		);
	}
}
